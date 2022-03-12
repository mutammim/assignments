# assignments

**Assignments** is a CLI tool I made for personal use. I keep track of my schoolwork using a Notion database, but I wanted a faster way to add new schoolwork than clicking through the Notion UI. ⚡

Of course, it's designed to work with how my Notion database is setup. So, it doesn't make sense for me to provide installation instructions. But, here are the technical details, in case you're curious.

---

The app is made up of one TypeScript file, which is compiled down to Node-compatible JS using `esbuild`.

The app works with 2 Notion databases. You can [find them here](https://mutammim.notion.site/Assignments-Sample-Databases-072bc01da6064cd991c0724697176888). Feel free to duplicate and use.

The app should be resilient to some database changes, like the addition of new selectors, but major changes will likely require tweaking of the app.

The first one, **Assignments**, looks like:

| Prop    | Type     |
| ------- | -------- |
| Course  | Relation |
| Type    | Select   |
| Status  | Select   |
| Date    | Date     |
| Section | Select   |

The relation connects to pages in the second database, **Courses**, which looks like:

| Prop   | Type   |
| ------ | ------ |
| Name   | Title  |
| Status | Select |

To launch the assignment adding UI, just run the file with no flags.

This won't work if two particular files aren't set up, though.

-   **`data.json`**
-   **`.env`**

For the app to work, it needs to know:

-   A working Notion API key, with the integration added to both databases
-   IDs for the 2 databases
-   IDs and names of the course pages (for the relation selector)
-   IDs and names for each option, such as status (for the other selectors)

The first two are handled by `.env`. The latter two are handled by `data.json`.

To setup `.env`, add the following variables:

-   NOTION_TOKEN
-   ASSIGNMENTS_DB_ID
-   COURSES_DB_ID

To setup `data.json`, run the app file with the flag `--load`.

That's almost about it! One last thing to be aware of: the page file names are a concatenation of the emoji-less course name, a bullet point, and the provided assignment name. (It's a personal preference thing.)
