import fs from "fs";
import { Client } from "@notionhq/client";
import * as inquirer from "inquirer";

import "dotenv/config";

const notion = new Client({
	auth: process.env.NOTION_TOKEN,
});

const ASSIGNMENTS_DB_ID = process.env.ASSIGNMENTS_DB_ID;
const COURSES_DB_ID = process.env.COURSES_DB_ID;

// Which options should be shown in the UI?
interface Options {
	courses: { id: string; name: string }[];
	statuses: { id: string; name: string }[];
	types: { id: string; name: string }[];
	sections: { id: string; name: string }[];
}

/**
 * Loads identifiers and whatnot from Notion into data.json, for caching
 */
async function load() {
	let options: Options = {
		courses: [],
		statuses: [],
		types: [],
		sections: [],
	};

	/* -------------------------------------------------------------------------- */
	/*                          Get general database data                         */
	/* -------------------------------------------------------------------------- */

	let assignmentsDatabase = await notion.databases.retrieve({
		database_id: ASSIGNMENTS_DB_ID,
	});

	let coursesDatabase = await notion.databases.query({
		database_id: COURSES_DB_ID,
		filter: {
			property: "Status",
			select: {
				equals: "Active",
			},
		},
	});

	/* -------------------------------------------------------------------------- */
	/*                    Process data to get selector options                    */
	/* -------------------------------------------------------------------------- */

	coursesDatabase.results.map((page) =>
		options.courses.push({
			id: page.id,
			// Set name to emoji and text
			name:
				(page as any).icon.emoji +
				" " +
				(page as any).properties.Name.title[0].text.content,
		})
	);

	(assignmentsDatabase.properties["Status"] as any).select.options.map(
		({ id, name }) => {
			options.statuses.push({ id, name });
		}
	);

	(assignmentsDatabase.properties["Type"] as any).select.options.map(
		({ id, name }) => {
			options.types.push({ id, name });
		}
	);

	(assignmentsDatabase.properties["Section"] as any).select.options.map(
		({ id, name }) => {
			options.sections.push({ id, name });
		}
	);

	/* -------------------------------------------------------------------------- */
	/*                        Save selector options to file                       */
	/* -------------------------------------------------------------------------- */

	fs.writeFileSync("data.json", JSON.stringify(options));
}

/**
 * Shows main UI for adding assignment
 */
async function add() {
	const options: Options = JSON.parse(fs.readFileSync("data.json", "utf-8"));

	inquirer.registerPrompt("datepicker", require("inquirer-datepicker"));

	/* -------------------------------------------------------------------------- */
	/*                               Show UI prompt                               */
	/* -------------------------------------------------------------------------- */

	let answers: {
		name: string;
		course: string;
		status: string;
		dateMode: string;
		date: any;
		type: string;
		section: string;
	} = await inquirer.prompt([
		{
			type: "input",
			name: "name",
			message: "Name:",
		},
		{
			type: "list",
			name: "course",
			message: "Course:",
			choices: options.courses,
			filter(value) {
				return options.courses.filter(
					(course) => course.name === value
				)[0].id;
			},
		},
		{
			type: "list",
			name: "status",
			message: "Status:",
			choices: options.statuses,
			filter(value) {
				return options.statuses.filter(
					(status) => status.name === value
				)[0].id;
			},
		},
		{
			type: "list",
			name: "dateMode",
			message: "Date mode:",
			choices: ["No date", "Only date", "Date and time"],
		},
		{
			type: "datepicker",
			name: "date",
			message: "Select a date:",
			format: ["Y", "/", "MM", "/", "DD"],
			when: (answers) => answers.dateMode === "Only date",
		},
		{
			type: "datepicker",
			name: "date",
			message: "Select a date and time:",
			format: ["Y", "/", "MM", "/", "DD", " ", "hh", ":", "mm", "A"],
			when: (answers) => answers.dateMode === "Date and time",
		},
		{
			type: "list",
			name: "type",
			message: "Type:",
			choices: options.types,
			filter(value) {
				return options.types.filter((type) => type.name === value)[0]
					.id;
			},
		},
		{
			type: "list",
			name: "section",
			message: "Section:",
			choices: options.sections,
			filter(value) {
				return options.sections.filter(
					(section) => section.name === value
				)[0].id;
			},
		},
	]);

	/* --------------------------- Convert date format -------------------------- */

	// If "only date" was selected, remove it from the ISO string

	if (answers.dateMode === "Only date")
		answers.date = answers.date.toISOString().slice(0, 10);

	/* ------------------------------ Adjust naming ----------------------------- */

	// Purpose is to get name of course based on ID passed in `answers`

	// The slicing happens because the course code is often like
	// "🍎 ABC123" and I want to turn that into just "ABC123"

	// Then, I just add a bullet point, and the provided assignment name, to get
	// something like "ABC123 • Final Test"

	answers.name =
		options.courses
			.filter(({ id }) => id === answers.course)[0]
			.name.slice(-6) +
		" • " +
		answers.name;

	/* -------------------------------------------------------------------------- */
	/*                          Add assignment to Notion                          */
	/* -------------------------------------------------------------------------- */

	await notion.pages.create({
		parent: {
			database_id: ASSIGNMENTS_DB_ID,
		},
		properties: {
			Name: {
				title: [
					{
						text: {
							content: answers.name,
						},
					},
				],
			},
			Course: {
				relation: [
					{
						id: answers.course,
					},
				],
			},
			Status: {
				select: {
					id: answers.status,
				},
			},
			Date: {
				date: {
					start: answers.date,
				},
			},
			Type: {
				select: {
					id: answers.type,
				},
			},
			Section: {
				select: {
					id: answers.section,
				},
			},
		},
	});

	console.log("Done!");
}

if (process.argv[2] === "--load") {
	load();
} else {
	add();
}
