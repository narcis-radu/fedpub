import CONFIG from './CONFIG.js';
import isNonEmptyString from './lang/isNonEmptyString.js';
import isStageEnvironment from './isStageEnvironment.js';
import loadResource from './dom/loadResource.js';

/**
 * Get the OneTrust ID based on the current domain
 * @return {String} The OneTrust ID for the current domain;
 * if a match isn't found, the first value of the `domains` object will be used
 */
function getOtDomainId() {
    const domains = {
        'adobe.com': '7a5eb705-95ed-4cc4-a11d-0cc5760e93db',
        'hlx.page': '3a6a37fe-9e07-4aa9-8640-8f358a623271',
        'project-helix.page': '45a95a10-dff7-4048-a2f3-a235b5ec0492',
        'helix-demo.xyz': 'ff276bfd-1218-4a19-88d4-392a537b6ce3',
        'adobeaemcloud.com': '70cd62b6-0fe3-4e20-8788-ef0435b8cdb1',
    };

    const currentDomain = Object.keys(domains)
        .find((domain) => window.location.host.indexOf(domain) > -1);

    return `${domains[currentDomain] || domains[Object.keys(domains)[0]]}`;
}

/**
 * Add FEDS-specific event listeners
 */
function addEventListeners() {
    // Remove the default header spacing when the FEDS experience has loaded
    window.addEventListener(CONFIG.EVENTS.FEDS_EXPERIENCE_LOADED, () => {
        const header = document.querySelector('body > header');

        if (header instanceof HTMLElement) {
            header.classList.add(CONFIG.SELECTORS.HEADER_FEDS_LOADED);
        }
    });
}

/**
 * Decide what FEDS experience to load based on the current cloud and category
 * @return {String} The name of the FEDS experience to be used
 */
function getExperience() {
    let experience = 'fedpub';

    if (window.fedPub
        && isNonEmptyString(window.fedPub.cloud)
        && isNonEmptyString(window.fedPub.category)) {
        experience += `/${window.fedPub.cloud}/${window.fedPub.category}`;
    }

    return experience;
}

/**
 * Defines the FEDS initialization configuration
 * and exposes it to the global namespace
 */
export default function initializeFEDS() {
    const experience = getExperience();

    // Define the FEDS configuration object
    window.fedsConfig = {
        locale: window.fedPub.locale,
        content: {
            experience,
        },
        privacy: {
            otDomainId: getOtDomainId(),
        },
    };

    // Define the FEDS script path based on the current environment
    const fedsPath = `https://www.${!isStageEnvironment ? '' : 'stage.'}adobe.com/etc.clientlibs/globalnav/clientlibs/base/feds.js`;

    // Attach FEDS-related event listeners
    addEventListeners();

    // Load the FEDS library
    loadResource({
        path: fedsPath,
        type: 'script',
        id: 'feds-script',
    });
}
