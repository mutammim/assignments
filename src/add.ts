import fs from "fs";
import path from "path";
import os from "os";
import * as inquirer from "inquirer";

import { ASSIGNMENTS_DB_ID, notion, Options } from "./main";

export async function add() {
	const formOptions: Options = JSON.parse(
		fs.readFileSync(path.join(os.homedir(), ".assignments"), "utf-8")
	);

	inquirer.registerPrompt("datepicker", require("inquirer-datepicker"));

	/* -------------------------------------------------------------------------- */
	/*                                  Show form                                 */
	/* -------------------------------------------------------------------------- */

	let responses: {
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
			choices: formOptions.courses.map((course) => {
				return {
					name: course.emoji + " " + course.text,
					value: course.text,
				};
			}),
			filter(value) {
				return formOptions.courses.filter(
					(course) => course.text === value
				)[0].id;
			},
		},
		{
			type: "list",
			name: "status",
			message: "Status:",
			choices: formOptions.statuses,
			filter(value) {
				return formOptions.statuses.filter(
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
			choices: formOptions.types,
			filter(value) {
				return formOptions.types.filter(
					(type) => type.name === value
				)[0].id;
			},
		},
		{
			type: "list",
			name: "section",
			message: "Section:",
			choices: formOptions.sections,
			filter(value) {
				return formOptions.sections.filter(
					(section) => section.name === value
				)[0].id;
			},
		},
	]);

	/* --------------------------- Convert date format -------------------------- */

	// If "Only date" was selected, ensure time is removed from the ISO string

	if (responses.dateMode === "Only date")
		responses.date = responses.date.toISOString().slice(0, 10);

	/* ------------------------------ Adjust naming ----------------------------- */

	// Purpose is to get name of course based on ID passed in `answers`
	// Then, I just add a bullet point, and the provided assignment name, to get
	// something like "ABC123 • Final Test"

	responses.name =
		formOptions.courses.filter(({ id }) => id === responses.course)[0]
			.text +
		" • " +
		responses.name;

	/* -------------------------------------------------------------------------- */
	/*                          Add assignment to Notion                          */
	/* -------------------------------------------------------------------------- */

	let pageData = {
		parent: {
			database_id: ASSIGNMENTS_DB_ID,
		},
		properties: {
			Name: {
				title: [
					{
						text: {
							content: responses.name,
						},
					},
				],
			},
			Course: {
				relation: [
					{
						id: responses.course,
					},
				],
			},
			Status: {
				select: {
					id: responses.status,
				},
			},
			Type: {
				select: {
					id: responses.type,
				},
			},
			Section: {
				select: {
					id: responses.section,
				},
			},
		},
	};

	if (responses.date) {
		(pageData as any).Date.date.start = responses.date;
		(pageData as any).Date.date.time_zone =
			Intl.DateTimeFormat().resolvedOptions().timeZone as any;
	}

	await notion.pages.create(pageData);

	console.log("Done!");
}
