import { Client } from "@notionhq/client";

import "dotenv/config";

import { add } from "./add";
import { load } from "./load";

export interface Options {
	courses: { id: string; emoji: string; text: string }[];
	statuses: { id: string; name: string }[];
	types: { id: string; name: string }[];
	sections: { id: string; name: string }[];
}

export const notion = new Client({
	auth: process.env.NOTION_TOKEN,
});

export const ASSIGNMENTS_DB_ID = process.env.ASSIGNMENTS_DB_ID;
export const COURSES_DB_ID = process.env.COURSES_DB_ID;

if (process.argv[2] === "--load") {
	load();
} else {
	add();
}
