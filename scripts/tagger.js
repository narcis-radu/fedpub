import localeMAP from './modules/localeMAP.js';
import getTaxonomy from './modules/taxonomy.js';

let taxonomy;
const currentLocale = new URLSearchParams(window.location.search).get('locale') || 'en';
const selectedTags = [];
const colors = ['fc5c65', 'fd9644', 'fed330', '26de81', '2bcbba', '45aaf2'];

function generateLocaleSwitcher() {
    const localeSelector = document.getElementById('locale');

    Object.keys(localeMAP).forEach((locale) => {
        localeSelector.insertAdjacentHTML('beforeend',
            `<option value="${locale}" ${locale === currentLocale ? 'selected' : ''}>${locale}</option>`);
    });

    localeSelector.addEventListener('change', (event) => {
        const url = new URL(window.location.href);
        url.searchParams.set('locale', event.target.value);
        window.location.href = url.toString();
    });
}

function filterTags(searchTerm = '') {
    let html = '';

    Object.entries(taxonomy.getFilters()).forEach(([filterName, tags], index) => {
        html += '<div class="filter">';
        html += `<h2>${filterName}</h2>`;
        html += `<style>[data-filter="${filterName}"] .tag--name { background-color: #${colors[index]} }</style>`;

        tags.forEach((tagName) => {
            const tag = taxonomy.getTag(tagName);

            if (typeof tag === 'object') {
                const offset = tag.name.toLowerCase().indexOf(searchTerm.toLowerCase());
                let path = '';

                if (tag.level2 !== null) {
                    // Sub-tag, need to show parent tag
                    path = `${tag.level1}/`;
                }

                // Tag contains part of search term
                if (offset !== -1) {
                    html += `<span class="tag" data-path="${path}"
                    data-filter="${tag.filter}"
                    data-category="${tag.category}"
                    data-name="${tag.name}">`;

                    if (path.length) {
                        html += `<span class="tag--path">${path}</span>`;
                    }

                    html += `<span class="tag--name">${tag.name}</span>`;
                    html += '</span>';
                }
            }
        });

        html += '</div>';
    });

    document.getElementById('results').innerHTML = html;
}

function updateSelection() {
    const filters = Object.keys(taxonomy.getFilters());
    const categories = Object.keys(taxonomy.getCategories());
    const selection = document.getElementById('selection');
    const selectionValues = {};
    let html = '';

    selectedTags.sort((a, b) => {
        // Compare by category first
        const categoryPositionItemA = categories.indexOf(a.category);
        const categoryPositionItemB = categories.indexOf(b.category);

        if (categoryPositionItemA < categoryPositionItemB) {
            return -1;
        }

        if (categoryPositionItemA > categoryPositionItemB) {
            return 1;
        }

        // Compare by filter
        const filterPositionItemA = filters.indexOf(a.filter);
        const filterPositionItemB = filters.indexOf(b.filter);

        if (filterPositionItemA < filterPositionItemB) {
            return -1;
        }

        if (filterPositionItemA > filterPositionItemB) {
            return 1;
        }

        // Compare by path
        if (a.path < b.path) {
            return -1;
        }

        if (a.path > b.path) {
            return 1;
        }

        // Compare by name
        if (a.name < b.name) {
            return -1;
        }

        if (a.name > b.name) {
            return 1;
        }

        return -1;
    });

    selectedTags.forEach((tag) => {
        html += `<span class="selectedTag" data-filter="${tag.filter}">`;

        if (tag.path.length) {
            html += `<span class="tag--path">${tag.path}</span>`;
        }

        html += `<span class="tag--name">${tag.name}</span>`;
        html += '</span>';

        // Add to selected category input
        if (!Object.prototype.hasOwnProperty.call(selectionValues, tag.category)) {
            selectionValues[tag.category] = [];
        }

        selectionValues[tag.category].push(tag.name);
    });

    // Build the text to be copied and button actions
    html += '<div class="copy-buttons">Copy tags for:';

    Object.entries(selectionValues).forEach(([key, value]) => {
        html += `<button data-target="selection-${key}" class="copy-button">${key}</button>`;
        html += `<input type="text" id="selection-${key}" value="${value.join(', ')}" class="notInViewport" />`;
    });

    html += '<div>';

    document.addEventListener('click', (event) => {
        const element = event.target;

        if (element.closest('.copy-button')) {
            const target = document.getElementById(`${element.getAttribute('data-target')}`);

            if (target instanceof HTMLElement) {
                target.select();
                document.execCommand('copy');
                element.setAttribute('disabled', 'disabled');
            }
        }
    });

    selection.innerHTML = html;
    selection.classList.toggle('visible', !!selectedTags.length);
}

function handleErrors() {
    document.getElementById('results').innerHTML = '<p>Could not retrieve tags.</p>';
    document.getElementById('search').setAttribute('disabled', 'disabled');
}

async function init() {
    generateLocaleSwitcher();
    try {
        taxonomy = await getTaxonomy(currentLocale);
        filterTags();
    } catch (e) {
        handleErrors();
    }

    const searchTerm = document.getElementById('search');

    searchTerm.addEventListener('input', (event) => {
        filterTags(event.target.value);
    });

    document.addEventListener('click', (event) => {
        const element = event.target.closest('.tag');

        if (element instanceof HTMLElement) {
            const selected = element.classList.contains('selected');
            const name = element.getAttribute('data-name');
            const category = element.getAttribute('data-category');
            const filter = element.getAttribute('data-filter');
            const path = element.getAttribute('data-path');

            if (!selected) {
                // Set selected class
                element.classList.add('selected');
                // Addd to selection
                selectedTags.push({
                    name,
                    category,
                    filter,
                    path,
                });
            } else {
                element.classList.remove('selected');
                selectedTags.splice(selectedTags.findIndex((el) => el.name === name
                    && el.category === category
                    && el.filter === filter
                    && el.path === path), 1);
            }

            updateSelection();
        }
    });
}

init();