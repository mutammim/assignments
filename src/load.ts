import fs from "fs";
import path from "path";
import os from "os";

import { ASSIGNMENTS_DB_ID, COURSES_DB_ID, notion, Options } from "./main";

export async function load() {
	let formOptions: Options = {
		courses: [],
		statuses: [],
		types: [],
		sections: [],
	};

	/* -------------------------------------------------------------------------- */
	/*                              Get database data                             */
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
	/*                        Process data for form options                       */
	/* -------------------------------------------------------------------------- */

	coursesDatabase.results.map((page) =>
		formOptions.courses.push({
			id: page.id,
			emoji: (page as any).icon.emoji,
			text: (page as any).properties.Name.title[0].text.content,
		})
	);

	(assignmentsDatabase.properties["Status"] as any).select.options.map(
		({ id, name }) => {
			formOptions.statuses.push({ id, name });
		}
	);

	(assignmentsDatabase.properties["Type"] as any).select.options.map(
		({ id, name }) => {
			formOptions.types.push({ id, name });
		}
	);

	(assignmentsDatabase.properties["Section"] as any).select.options.map(
		({ id, name }) => {
			formOptions.sections.push({ id, name });
		}
	);

	/* -------------------------------------------------------------------------- */
	/*                        Save selector options to file                       */
	/* -------------------------------------------------------------------------- */

	fs.writeFileSync(
		path.join(os.homedir(), ".assignments"),
		JSON.stringify(formOptions)
	);
}
