/**
 * Trims string to have at most charAmount characters.
 * @param str 
 * @param charAmount 
 * @returns str, if str.length <= charAmount, or the first
 *          charAmount characters followed by "..."
 */
export function trim(str, charAmount) {
    let toSum = '...';
    if (str.length <= charAmount) toSum = "";
    return str.slice(0, charAmount) + toSum;
}

export function wrapper(obj, func, ...args) {
    return func(obj.$graffiti, obj.$graffitiSession, ...args);
}

export function $$(document, selector) {
    return Array.from(document.querySelectorAll(selector));
}