/* global browser, updateBrowserActionSelection, updateToolsMenuSelection,
   logger, handleError */


const APPEARS_HIGHER_IN_LIST = -1;
const SAME = 0;
const APPEARS_LOWER_IN_LIST = 1;
const NUM_DEFAULT_THEMES = 3;

// var currentThemeId;
var currentThemes = [];
var defaultThemes = [];
// Legacy default theme ID:
//var defaultTheme = {id: '{972ce4c6-7e08-4474-a285-3208198ce6fd}'};
// TODO: add in logic at startup that assigns the correct default theme id based on FF version
var defaultTheme = {id: 'default-theme@mozilla.org'};

function switchTheme(newId) {
    logger.log(newId);
    browser.management.setEnabled(newId, true);
}

function startThemePreview(theme) {
    logger.log(theme);
    switchTheme(theme.id);
}

function endThemePreview() {    
    browser.storage.local.get("currentThemeId").then((pref) => {
        logger.log(pref.currentThemeId);
        switchTheme(pref.currentThemeId);
    });
}

function setCurrentTheme(newIndex, oldIndex) {  
    logger.log(newIndex);
    logger.log(oldIndex);
    if(newIndex !== oldIndex)
    {
        updateCurrentThemeId(newIndex);
        updateCurrentIndex(newIndex);
    }
}

function updateCurrentThemeId(newIndex) {
    logger.log(newIndex);
    let currentThemeId;
    if(newIndex < currentThemes.length) {
        currentThemeId = currentThemes[newIndex].id;
    } else {
        currentThemeId = defaultThemes[newIndex - (currentThemes.length+1)].id;
    }
    logger.log(currentThemeId);
    browser.storage.local.set({'currentThemeId': currentThemeId})
        .catch(handleError);
}

function updateCurrentIndex(newIndex) {
    logger.log(newIndex);
    browser.storage.local.set({current: newIndex}).catch(handleError); 
}


function activateDefaultTheme() {
    logger.log("Activating default theme");
    let index = getDefaultThemeIndex();    
    switchTheme(defaultTheme.id);
    let getOldThemeIndex = browser.storage.local.get("current");
    getOldThemeIndex.then((pref) =>
        {
            setCurrentTheme(index, pref.current);
            updateBrowserActionSelection(index, pref.current);
            updateToolsMenuSelection(index, pref.current);
        }
    );
}

function getDefaultThemeIndex() {
    let index;
    for(index = 0; index < defaultThemes.length; index++) {
        if(defaultTheme.id === defaultThemes[index].id) {
            index = index + currentThemes.length + 1;
            break;
        }
    }
    logger.log(index);
    return index;
}

function sortThemes(addonInfos) {
    currentThemes = addonInfos.filter(info => "theme" === info.type);

    logger.log (`Themes found ${currentThemes.length}`);

    currentThemes.sort(function (a, b) { 
            return a.name.localeCompare(b.name); 
    });
    extractDefaultThemes();
    logger.log (`User installed themes ${currentThemes.length}`);
}

// Assumes currentThemes and defaultThemes are accurate
// (IE sortThemes has been called previously)
function validateCurrentIndex(current, currentThemeId) 
{

    logger.log(current);
    logger.log(currentThemeId);
    // On first run, the currentThemeId will be null. The current index skips
    // the index value at currentThemes.length to account for the separator. So,
    // if the current index is equal to currentThemes.length the theme list has
    // changed and the new active theme must be found. Likewise, if the current
    // index is greater than the last possible default theme index, the theme
    // list has changed and the new active theme must be found.
    if('undefined' === typeof(currentThemeId) || 
        null === currentThemeId ||
        currentThemes.length === current ||
        current > currentThemes.length + defaultThemes.length)
    {
        return findActiveTheme();
    }

    let themesToCheck;
    let themeIndex;
    logger.log(`User themes ${currentThemes.length}, Current index ${current}`);

    if(currentThemes.length < current) {
        themesToCheck = defaultThemes;
        themeIndex = current - (currentThemes.length + 1);
        logger.log(`Validating default theme ${themeIndex}`);
    } else {
        themesToCheck = currentThemes;
        themeIndex = current;        
        logger.log(`Validating user installed theme ${themeIndex}`);
    }

    if(true === themesToCheck[themeIndex].enabled) {
        return current;
    }
    
    return findActiveTheme();
        
}

function findActiveTheme() {
    let index;

    index = currentThemes.map(theme => theme.enabled).indexOf(true);
    logger.log(index);

    if(-1 !== index) {
        updateCurrentIndex(index);
        return index;
    }

    index = defaultThemes.map(theme => theme.enabled).indexOf(true);
    logger.log(index);

    if(-1 !== index) {
        index = index + currentThemes.length + 1;
        updateCurrentIndex(index);
        return index;
    }

    logger.log(false);
    return false;
}

function extractDefaultThemes() {
    logger.log("Separating default themes");

    defaultThemes = currentThemes.filter(isDefaultTheme);
    currentThemes = currentThemes.filter(theme => ! isDefaultTheme(theme));
}

function isDefaultTheme(theme)
{
    return([
        "firefox-compact-dark@mozilla.org@personas.mozilla.org",
        "firefox-compact-light@mozilla.org@personas.mozilla.org",
        "firefox-compact-dark@mozilla.org",
        "firefox-compact-light@mozilla.org",
        "default-theme@mozilla.org",
        "firefox-alpenglow@mozilla.org",
        "{972ce4c6-7e08-4474-a285-3208198ce6fd}"
    ].includes(theme.id));
}

function toolsMenuThemeSelect(index)
{
    logger.log(`Selecting theme ${index}`);
    let themeId;
    if(index < currentThemes.length) {
        themeId = currentThemes[index].id;
    } else {
        themeId = defaultThemes[index-(currentThemes.length+1)].id;
    }
    switchTheme(themeId);

    browser.storage.local.get("current").then((pref) =>
        {
            // Because Mozilla automatically separates the the items above
            // and below a separator into distinct groups, when switching
            // from a default theme to a user installed, or vice versa, the
            // old group's radio button must be disabled manually 
            if((pref.current < currentThemes.length  &&
                index > currentThemes.length) ||
               (pref.current > currentThemes.length  &&
                index < currentThemes.length))
            {
                let updateToolMenu = browser.menus
                      .update(String(pref.current), {checked: false});
                updateToolMenu.catch(handleError);
            }
            
            setCurrentTheme(index, pref.current);
            updateBrowserActionSelection(index, pref.current);
        });
}
