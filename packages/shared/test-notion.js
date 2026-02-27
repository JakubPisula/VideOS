require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function main() {
    console.log('Testing Notion Connection...');
    try {
        const response = await notion.search({
            filter: {
                value: 'database',
                property: 'object'
            }
        });

        if (response.results.length === 0) {
            console.log("Connected to Notion, but no databases found. Did you share the database with your integration?");
            return;
        }

        const databases = response.results.map(db => {
            let name = 'Untitled';
            if (db.title && db.title.length > 0) {
                name = db.title.map(t => t.plain_text).join('');
            }
            return {
                id: db.id,
                name: name,
                properties: Object.keys(db.properties)
            };
        });

        console.log('--- Found Databases ---');
        console.log(JSON.stringify(databases, null, 2));

    } catch (error) {
        console.error('Failed to connect or fetch data:', error.message);
    }
}

main();
