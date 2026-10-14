/**
 * Deterministic Accessibility Remediation Guidance
 * 
 * IMPORTANT INTEGRITY REQUIREMENT:
 * Built-in guidance is strictly deterministic rule-based advice derived from WCAG 2.1/2.2 AA techniques
 * and axe-core specifications. It is NEVER to be labeled as or conflated with AI-generated responses.
 * 
 * Each finding explains:
 * 1. The problem detected
 * 2. Affected users
 * 3. Why it matters
 * 4. Practical fix with a concrete code example
 */

const RULE_GUIDANCE_MAP = {
  'image-alt': {
    title: 'Image Missing Alternative Text',
    wcag: 'WCAG 1.1.1 Non-text Content (Level A)',
    problem: 'The <img> element is missing an "alt" attribute, rendering its visual content completely inaccessible to non-visual user agents.',
    affectedUsers: 'Blind and low-vision individuals using screen readers (NVDA, JAWS, VoiceOver), users on slow connections where images fail to download, and automated indexing services.',
    whyItMatters: 'Without alternative text, screen readers announce raw filenames (e.g., "IMG_4920.jpg") or skip the image entirely. If the image conveys a vital public document, official agency seal, or step in a civic workflow, citizens are denied equal access.',
    practicalFix: 'Add a concise, meaningful "alt" attribute describing the content and function. If the image is purely decorative and conveys no information, explicitly specify alt="" and aria-hidden="true" so assistive tech ignores it.',
    badCode: '<img src="/assets/pay-taxes.png">',
    goodCode: '<!-- Informative Image -->\n<img src="/assets/pay-taxes.png" alt="File and pay municipal property taxes online">\n\n<!-- Decorative Divider -->\n<img src="/assets/divider-line.svg" alt="" aria-hidden="true">',
  },

  'label': {
    title: 'Form Input Missing Programmatic Label',
    wcag: 'WCAG 1.3.1 Info and Relationships (Level A), WCAG 4.1.2 Name, Role, Value (Level A)',
    problem: 'An interactive form control (<input>, <select>, <textarea>) does not have a programmatically associated <label> element or accessible name attribute.',
    affectedUsers: 'Screen reader users who cannot determine what data is required, users with cognitive or memory disabilities who need persistent labels, and speech recognition users who target inputs by vocalizing their labels.',
    whyItMatters: 'Placeholder text is not a label—it disappears when typing starts, has low contrast, and is frequently unannounced by assistive tech. Unlabeled fields prevent citizens from completing voter registration, benefit claims, or license renewals.',
    practicalFix: 'Associate a <label for="field-id"> with matching id on the input. For search bars or standalone controls, provide an explicit aria-label attribute.',
    badCode: '<input type="text" id="citizen-account" placeholder="Enter Account Number">',
    goodCode: '<label for="citizen-account">Public Service Account Number</label>\n<input type="text" id="citizen-account" name="citizen-account" autocomplete="off">\n\n<!-- Standalone Search Control -->\n<input type="search" id="site-search" aria-label="Search civic services and municipal ordinances">',
  },

  'color-contrast': {
    title: 'Insufficient Color Contrast Ratio',
    wcag: 'WCAG 1.4.3 Contrast (Minimum) (Level AA)',
    problem: 'The contrast ratio between the foreground text color and background color falls below the mandatory accessibility threshold.',
    affectedUsers: 'Individuals with low vision, older adults with declining contrast sensitivity, people with color vision deficiencies (color blindness), and mobile users viewing screens in direct sunlight.',
    whyItMatters: 'When text blends into its background, vital instructions, payment deadlines, and legal disclaimers become completely illegible, causing preventable user errors.',
    practicalFix: 'Increase the luminance contrast ratio. Regular text (< 18pt or < 14pt bold) requires at least 4.5:1. Large text (>= 18pt or >= 14pt bold) requires at least 3.0:1.',
    badCode: '/* Contrast ratio: ~1.4:1 (FAILS) */\n<p style="color: #cccccc; background-color: #ffffff;">Payment deadline: November 15</p>',
    goodCode: '/* Contrast ratio: ~7.2:1 (PASSES Level AAA) */\n<p style="color: #334155; background-color: #ffffff;">Payment deadline: November 15</p>',
  },

  'button-name': {
    title: 'Button Missing Discernible Accessible Name',
    wcag: 'WCAG 4.1.2 Name, Role, Value (Level A)',
    problem: 'An interactive <button> element contains no readable text, aria-label, or child element with text content.',
    affectedUsers: 'Screen reader users who hear only "button", and speech-to-text voice command users who cannot target or click the button by speech.',
    whyItMatters: 'Buttons execute actions (Submit Application, Cancel Request, Delete Record). If a button is unlabeled, users cannot discern what consequence clicking it will have.',
    practicalFix: 'Include visible text inside the button, or provide an aria-label attribute describing the action for icon-only buttons.',
    badCode: '<button type="button"><svg class="icon-trash"></svg></button>',
    goodCode: '<!-- With aria-label -->\n<button type="button" aria-label="Delete saved draft">\n  <svg class="icon-trash" aria-hidden="true"></svg>\n</button>\n\n<!-- With screen-reader visible text -->\n<button type="button">\n  <svg class="icon-trash" aria-hidden="true"></svg>\n  <span class="sr-only">Delete saved draft</span>\n</button>',
  },

  'link-name': {
    title: 'Link Missing Discernible Text',
    wcag: 'WCAG 2.4.4 Link Purpose (In Context) (Level A)',
    problem: 'A hyperlink (<a>) has no text content, or relies on ambiguous non-descriptive phrases such as "Click Here" or "Read More".',
    affectedUsers: 'Screen reader users who navigate pages by browsing an alphabetical list of links, keyboard navigators, and users with cognitive disabilities.',
    whyItMatters: 'When assistive tech lists links out of context, five links saying "Click Here" provide zero information on where each link leads.',
    practicalFix: 'Ensure link text clearly describes the destination or resource. Add an aria-label if visual space is strictly constrained.',
    badCode: '<a href="/permits/building-application.pdf">Click here</a> to download.',
    goodCode: '<a href="/permits/building-application.pdf">Download Residential Building Permit Application (PDF, 250 KB)</a>',
  },

  'document-title': {
    title: 'Document Missing Descriptive Title Element',
    wcag: 'WCAG 2.4.2 Page Titled (Level A)',
    problem: 'The HTML <head> lacks a <title> element or the title tag is empty.',
    affectedUsers: 'Screen reader users, braille display users, and anyone navigating across multiple browser tabs.',
    whyItMatters: 'The page title is the very first piece of information announced by screen readers upon page load. Without it, users cannot verify they reached the intended government agency or portal.',
    practicalFix: 'Add a concise, unique <title> describing the specific page and agency/organization name.',
    badCode: '<head>\n  <meta charset="utf-8">\n</head>',
    goodCode: '<head>\n  <meta charset="utf-8">\n  <title>Renew Driver\'s License | State Department of Transportation</title>\n</head>',
  },

  'html-has-lang': {
    title: 'HTML Root Missing Primary Language Attribute',
    wcag: 'WCAG 3.1.1 Language of Page (Level A)',
    problem: 'The root <html> element does not specify a valid "lang" attribute (e.g. lang="en").',
    affectedUsers: 'Screen reader users and automated browser translation tools.',
    whyItMatters: 'Screen readers use the language tag to choose the appropriate text-to-speech pronunciation engine and accent library. Without it, English text may be pronounced using Spanish or French phonetic rules.',
    practicalFix: 'Add a valid IETF BCP 47 language code to the root <html> tag.',
    badCode: '<html>',
    goodCode: '<html lang="en">\n<!-- For Spanish portals -->\n<html lang="es">',
  },

  'heading-order': {
    title: 'Illogical Heading Level Hierarchy Order',
    wcag: 'WCAG 1.3.1 Info and Relationships (Level A)',
    problem: 'Heading levels are skipped (e.g., an <h1> is followed immediately by an <h3> or <h4> without an intervening <h2>).',
    affectedUsers: 'Screen reader and keyboard users who navigate web pages by jumping between heading levels to understand page structure.',
    whyItMatters: 'Skipped headings convey a broken outline, causing users to believe content was omitted, misplaced, or corrupted.',
    practicalFix: 'Maintain sequential heading levels (<h1> -> <h2> -> <h3>). Use CSS classes for visual font sizing instead of skipping heading tags.',
    badCode: '<h1>County Health Department</h1>\n<!-- Skipped H2 -->\n<h4>Clinic Vaccination Schedule</h4>',
    goodCode: '<h1>County Health Department</h1>\n<h2>Public Health Programs</h2>\n<h3>Clinic Vaccination Schedule</h3>',
  },

  'duplicate-id-active': {
    title: 'Duplicate Interactive Element ID',
    wcag: 'WCAG 4.1.1 Parsing (Level A)',
    problem: 'Multiple interactive elements share the identical "id" attribute value on the same page.',
    affectedUsers: 'Assistive technology users and keyboard navigators relying on labels and aria-controls relationships.',
    whyItMatters: 'Browsers and assistive tools link <label for="id"> and ARIA relationships to the first match in the DOM. Duplicates cause form submissions, toggles, and screen reader announcements to target the wrong element.',
    practicalFix: 'Ensure every "id" attribute value across the DOM is unique.',
    badCode: '<button id="submit-btn">Save Draft</button>\n<button id="submit-btn">Final Submit</button>',
    goodCode: '<button id="draft-submit-btn">Save Draft</button>\n<button id="final-submit-btn">Final Submit</button>',
  },
};

/**
 * Retrieves deterministic, standards-based guidance for a given rule.
 * 
 * @param {string} ruleId
 * @param {string} helpText
 * @param {string} helpUrl
 * @returns {string} Formatted deterministic guidance block
 */
export function getDeterministicGuidance(ruleId, helpText = '', helpUrl = '') {
  const match = RULE_GUIDANCE_MAP[ruleId];
  if (match) {
    let guidance = `[Deterministic WCAG Rule Guidance — Standards Based (Not AI)]\n`;
    guidance += `• Standard: ${match.wcag}\n`;
    guidance += `• Problem: ${match.problem}\n`;
    guidance += `• Affected Users: ${match.affectedUsers}\n`;
    guidance += `• Why It Matters: ${match.whyItMatters}\n`;
    guidance += `• Practical Fix: ${match.practicalFix}\n`;
    if (match.badCode && match.goodCode) {
      guidance += `• Code Example:\n[NON-COMPLIANT]\n${match.badCode}\n\n[COMPLIANT FIX]\n${match.goodCode}`;
    }
    return guidance;
  }

  const cleanHelp = helpText ? helpText.trim() : 'Review element attributes according to WCAG 2.1 AA specifications.';
  let generic = `[Deterministic WCAG Rule Guidance — Standards Based (Not AI)]\n`;
  generic += `• Standard: WCAG 2.1 / 2.2 Level AA\n`;
  generic += `• Problem: Element failed automated check "${ruleId}": ${cleanHelp}\n`;
  generic += `• Affected Users: Citizens with disabilities relying on assistive technologies to access digital public services.\n`;
  generic += `• Why It Matters: Public services must be accessible by default under Section 508 and WCAG standards.\n`;
  generic += `• Practical Fix: Review the affected DOM element against the official axe-core rule specification at ${helpUrl || 'https://www.w3.org/WAI/WCAG21/quickref/'}.`;
  return generic;
}
