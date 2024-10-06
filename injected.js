/**
 * Gets the HTMLTableElement of the grade table.
 *
 * @returns {HTMLTableElement} The grade table element
 */
function getGradeTableElement() {
	const s = "#wrapper>div.divcontent>div.content>form>table:nth-child(5)";
	return document.querySelector(s);
}

/**
 * Gets the rows of the grade table
 *
 * @returns {HTMLTableRowElement[]} The rows of the grade table
 */
function getGradeTableRows() {
	return [...getGradeTableElement().querySelectorAll("tr")].slice(1);
}

/**
 * Determines if a row is a module row. A module row is a row that contains a
 * module grade and which's id is not 100, 300, 400 or 80000.
 *
 * 100:     Compulsory Modules
 * 300:     Focus Modules
 * 400:     Elective Modules
 * 80000:   Interdisziplinäre Wochen
 *
 * @param {HTMLTableRowElement} row The row to check
 * @returns
 */
function isModuleRow(row) {
	if (!row.children || row.children.length != 12) return false;
	return !isModulesHeaderRow(row) && row.children[6].innerText.trim() !== "";
}

/**
 * Determines if a row is the header row of the modules. A header has an exam id
 * of 100, 300, 400 or 80000.
 *
 * @param {HTMLTableRowElement} row The row to check
 */
function isModulesHeaderRow(row) {
	if (!row.children || row.children.length < 1) return false;
	const id = parseInt(row.children[0].innerText.trim());
	return [100, 300, 400, 80000].includes(id);
}

/**
 * Adds a cell to a row.
 *
 * @param {HTMLTableRowElement} row The row to insert the cell into
 * @param {string} text The text to display in the cell
 * @param {number} colSpan The number of columns the cell should span
 */
function addCell(row, text, colSpan = 1) {
	const cell = document.createElement("td");
	cell.className = `nowrap qis_kontoOnTop`;
	cell.colSpan = `${colSpan}`;
	cell.innerText = text;
	row.appendChild(cell);
}

/**
 * Creates a module object from a module row.
 *
 * @param {HTMLTableRowElement} row The row to parse
 * @returns
 */
function parseModuleRow(row) {
	let id = parseInt(row.children[0].innerText.trim());
	let name = row.children[1].innerText.trim();

	let grade = parseFloat(row.children[6].innerText.trim().replace(",", "."));
	if (isNaN(grade)) grade = 0;

	let points = parseFloat(row.children[7].innerText.trim().replace(",", "."));
	if (isNaN(points)) points = 0;

	let credits = parseFloat(row.children[9].innerText.trim().replace(",", "."));
	if (isNaN(credits)) credits = 0;

	return {
		id,
		name,
		grade,
		points,
		credits,
	};
}

/**
 * Parses the header row of a module.
 *
 * @param {HTMLTableRowElement} row The row to parse
 * @returns
 */
function parseModuleHeaderRow(row) {
	let id = parseInt(row.children[0].innerText.trim());
	let name = row.children[1].innerText.trim();
	let acquiredCredits = parseFloat(
		row.children[9].innerText.trim().replace(",", "."),
	);

	return { id, name, acquiredCredits, modules: [] };
}

/**
 * Get all modules grouped by their module type.
 *
 * @param {HTMLTableRowElement[]} moduleRows the rows of the module table
 * @returns
 */
function getGroupedModules() {
	const tableRows = getGradeTableRows();
	const modules = [];
	for (let i = 0; i < tableRows.length; i++) {
		if (isModulesHeaderRow(tableRows[i])) {
			const moduleHeader = parseModuleHeaderRow(tableRows[i]);
			for (let j = i + 1; j < tableRows.length; j++) {
				if (isModulesHeaderRow(tableRows[j])) {
					i = j - 1;
					break;
				}
				if (isModuleRow(tableRows[j])) {
					moduleHeader.modules.push(parseModuleRow(tableRows[j]));
				}
			}
			modules.push(moduleHeader);
		}
	}
	return modules;
}


function insertRequiredCreditsInput() {
	const tbody = document.querySelector("#wrapper > div.divcontent > div.content > form > table:nth-child(2) > tbody")
	// Copy the last row
	const lastRow = tbody.children[tbody.children.length - 1]
	const newRow = lastRow.cloneNode(true)

	const input = document.createElement("input")
	input.type = "number"
	input.id = "required_credits"

	newRow.children[0].innerText = "Benötigte ECTS laut PO"
	newRow.children[1].innerText = ""
	newRow.children[1].appendChild(input)

	tbody.appendChild(newRow)
}

function calculateGrade(requiredCredits) {
	const groupedModules = getGroupedModules();
	const totalCredits = groupedModules.reduce((a, b) => a + b.acquiredCredits, 0);

	groupedModules.forEach((m) => {
		m.modules.forEach((module) => {
			const weigth = module.credits / totalCredits
			const weightedGrade = module.grade * weigth
			const weightedPoints = module.points * weigth
			module.weightedGrade = weightedGrade
			module.weightedPoints = weightedPoints
		});
	});

	const modules = groupedModules.flatMap((m) => m.modules);
	const avgGrade = Math.min(6, Math.max(1, modules.reduce((a, b) => a + b.weightedGrade, 0)));
	const avgPoints = modules.reduce((a, b) => a + b.points, 0) / modules.length;

	if (document.querySelector("#better-qis-extension-results")) {
		document.querySelector("#better-qis-extension-results").remove()
	}

	const rowToInsert = getGradeTableElement().insertRow(-1);
	rowToInsert.id = "better-qis-extension-results";
	addCell(rowToInsert, "", 8);
	addCell(rowToInsert, `∅ ${avgGrade.toFixed(2)}`);
	addCell(rowToInsert, `∅ ${avgPoints.toFixed(2)}`);
	addCell(rowToInsert, "");
	addCell(rowToInsert, totalCredits.toFixed(2));

	for (let i = 0; i < 2; i++) addCell(rowToInsert, "");
}

calculateGrade()

calculateGrade()

