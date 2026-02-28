import fs from 'fs';
import path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────
interface Config {
    notionToken: string;
    selectedDatabase: string;
    notionProperties: { name: string; type: string }[];
    mappings: { notionProperty: string; localAlias: string }[];
    [key: string]: any;
}

interface LocalProject {
    id: string;
    notionId?: string;
    clientName: string;
    projectName: string;
    properties: Record<string, string>;
    notionLastEditedTime?: string;
    [key: string]: any;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');

export function getConfig(): Config | null {
    const p = path.join(DATA_DIR, 'config.json');
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function getProjects(): LocalProject[] {
    const p = path.join(DATA_DIR, 'projects.json');
    if (!fs.existsSync(p)) return [];
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
}

export function saveProjects(projects: LocalProject[]) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2), 'utf8');
}

// ── Extract value from Notion property object ─────────────────────────────
export function extractNotionValue(prop: any): string {
    if (!prop) return '';
    switch (prop.type) {
        case 'title': return prop.title?.[0]?.plain_text || '';
        case 'rich_text': return prop.rich_text?.[0]?.plain_text || '';
        case 'select': return prop.select?.name || '';
        case 'multi_select': return (prop.multi_select || []).map((s: any) => s.name).join(', ');
        case 'status': return prop.status?.name || '';
        case 'number': return prop.number != null ? String(prop.number) : '';
        case 'date': return prop.date?.start || '';
        case 'checkbox': return prop.checkbox ? 'Yes' : 'No';
        case 'url': return prop.url || '';
        case 'email': return prop.email || '';
        case 'phone_number': return prop.phone_number || '';
        default: return '';
    }
}

// ── Build Notion property payload for PATCH ────────────────────────────────
export function buildNotionPropertyPayload(
    propName: string,
    propType: string,
    value: string
): any {
    if (!value) return null;
    switch (propType) {
        case 'title':
            return { title: [{ text: { content: value } }] };
        case 'rich_text':
            return { rich_text: [{ text: { content: value } }] };
        case 'select':
            return { select: { name: value } };
        case 'multi_select':
            return { multi_select: value.split(',').map(s => ({ name: s.trim() })).filter(s => s.name) };
        case 'status':
            return { status: { name: value } };
        case 'number':
            return { number: parseFloat(value) || 0 };
        case 'date':
            return { date: { start: value } };
        case 'checkbox':
            return { checkbox: value.toLowerCase() === 'yes' || value === 'true' };
        case 'url':
            return { url: value };
        case 'email':
            return { email: value };
        default:
            return null;
    }
}

// ── PULL: Notion → Local ──────────────────────────────────────────────────
// Fetches all pages from the Notion DB and updates local projects
export async function pullFromNotion(config: Config, logs: string[]): Promise<number> {
    const log = (m: string) => { logs.push(`[PULL] ${m}`); };
    let projects = getProjects();
    let updateCount = 0;

    // Fetch all pages from Notion DB (paginated)
    let hasMore = true;
    let startCursor: string | undefined;
    const allNotionPages: any[] = [];

    while (hasMore) {
        const body: any = { page_size: 100 };
        if (startCursor) body.start_cursor = startCursor;

        const res = await fetch(`https://api.notion.com/v1/databases/${config.selectedDatabase}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.notionToken}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            log(`Error querying Notion DB: ${res.status} ${await res.text()}`);
            break;
        }

        const data = await res.json();
        allNotionPages.push(...data.results);
        hasMore = data.has_more;
        startCursor = data.next_cursor;
    }

    log(`Fetched ${allNotionPages.length} pages from Notion.`);

    for (const page of allNotionPages) {
        const notionId = page.id;
        const remoteEditedTime = page.last_edited_time;

        // Find matching local project
        const localIdx = projects.findIndex(p => p.notionId === notionId);

        if (localIdx === -1) {
            // New page in Notion — create local project entry
            const props: Record<string, string> = {};
            let clientName = '';
            let projectName = '';

            for (const propDef of config.notionProperties) {
                const notionProp = page.properties[propDef.name];
                const val = extractNotionValue(notionProp);
                props[propDef.name] = val;

                if (propDef.type === 'title' && val) {
                    const parts = val.split(' | ');
                    clientName = parts[0]?.trim() || val;
                    projectName = parts[1]?.trim() || val;
                }
            }

            const newProject: LocalProject = {
                id: `PRJ-${String(Date.now()).slice(-6)}`,
                notionId,
                clientName: clientName || 'Unknown',
                projectName: projectName || 'Untitled',
                description: '',
                status: props['Status'] || 'New',
                properties: props,
                createdAt: page.created_time,
                notionSynced: true,
                frameioSynced: false,
                notionLastEditedTime: remoteEditedTime,
            };

            projects.unshift(newProject);
            updateCount++;
            log(`New project imported: ${newProject.id} (${newProject.projectName})`);
            continue;
        }

        // Existing project — check if Notion is newer
        const local = projects[localIdx];
        if (local.notionLastEditedTime && new Date(remoteEditedTime) <= new Date(local.notionLastEditedTime)) {
            continue; // No changes
        }

        // Update local properties from Notion
        if (!local.properties) local.properties = {};
        for (const propDef of config.notionProperties) {
            const notionProp = page.properties[propDef.name];
            if (notionProp) {
                local.properties[propDef.name] = extractNotionValue(notionProp);
            }
        }

        // Update title-derived fields
        const titleProp = config.notionProperties.find(p => p.type === 'title');
        if (titleProp && local.properties[titleProp.name]) {
            const parts = local.properties[titleProp.name].split(' | ');
            if (parts.length >= 2) {
                local.clientName = parts[0].trim();
                local.projectName = parts[1].trim();
            }
        }

        local.notionLastEditedTime = remoteEditedTime;
        local.notionSynced = true;
        projects[localIdx] = local;
        updateCount++;
        log(`Updated ${local.id} from Notion.`);
    }

    saveProjects(projects);
    return updateCount;
}

// ── PUSH: Local → Notion ──────────────────────────────────────────────────
// For projects that have local changes not yet in Notion
export async function pushToNotion(config: Config, logs: string[]): Promise<number> {
    const log = (m: string) => { logs.push(`[PUSH] ${m}`); };
    const projects = getProjects();
    let pushCount = 0;

    for (const project of projects) {
        if (!project.notionId) continue;
        if (!project.properties) continue;

        // Build PATCH payload with all non-empty properties
        const notionProps: Record<string, any> = {};
        for (const propDef of config.notionProperties) {
            const localVal = project.properties[propDef.name];
            if (localVal !== undefined && localVal !== '') {
                const payload = buildNotionPropertyPayload(propDef.name, propDef.type, localVal);
                if (payload) {
                    notionProps[propDef.name] = payload;
                }
            }
        }

        if (Object.keys(notionProps).length === 0) continue;

        try {
            const res = await fetch(`https://api.notion.com/v1/pages/${project.notionId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${config.notionToken}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ properties: notionProps }),
            });

            if (res.ok) {
                pushCount++;
                log(`Pushed ${project.id} to Notion.`);
            } else {
                const errText = await res.text();
                log(`Failed to push ${project.id}: ${res.status} - ${errText}`);
            }
        } catch (err: any) {
            log(`Error pushing ${project.id}: ${err.message}`);
        }
    }

    return pushCount;
}

// ── FULL SYNC (both directions) ────────────────────────────────────────────
export async function fullSync(): Promise<{ logs: string[]; pulled: number; pushed: number }> {
    const logs: string[] = [];
    const config = getConfig();

    if (!config || !config.notionToken || !config.selectedDatabase) {
        logs.push('Sync aborted: Notion not configured.');
        return { logs, pulled: 0, pushed: 0 };
    }

    logs.push(`Starting full sync at ${new Date().toISOString()}`);

    // Pull first (Notion = SSOT, so Notion data takes priority)
    const pulled = await pullFromNotion(config, logs);

    // Then push local changes that haven't been synced
    const pushed = await pushToNotion(config, logs);

    logs.push(`Sync complete: ${pulled} pulled, ${pushed} pushed.`);
    return { logs, pulled, pushed };
}
