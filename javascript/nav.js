
function toggleNavSection(id) {
	let element = document.getElementById("section-" + id);
	if (element.style.getPropertyValue("grid-template-rows") != "0fr")
		hideNavSection(id, element);
	else
		showNavSection(id, element);
}

function hideNavSection(id, element) {
	element.style.setProperty("grid-template-rows", "0fr");
	let header = document.getElementById("section-header-" + id);
	header.childNodes[1].style.setProperty("transform", "rotate(-180deg)");
}

function showNavSection(id, element) {
	element.style.setProperty("grid-template-rows", "1fr");
	let header = document.getElementById("section-header-" + id);
	header.childNodes[1].style.setProperty("transform", "rotate(0deg)");
}
