/* global browser, startRotateAlarm, getMenuData, buildBrowserActionMenu,
   buildToolsSubmenu, buildContextMenu, rotateOnStartup, handlePrefChange,
   rebuildMenus, toolsMenuThemeSelect, activateDefaultTheme, rotate */


function handleStartup() 
{
    var checkDefaultsLoaded = browser.storage.local.get("defaults_loaded");
    checkDefaultsLoaded
    .then(loadDefaultPrefsIfNeeded)
    .then(setLogger)
    .then(startRotateAlarm)
    .then(getMenuData)
    .then(buildBrowserActionMenu)
    .then(buildToolsSubmenu)
    .then(buildContextMenu)
    .then(rotateOnStartup)
    .then(function() 
    {
        return browser.storage.onChanged.addListener(handlePrefChange);
    })
    .catch(handleError);
}

// Verify if we need to load the default preferences by checking if the 
// default_loaded flag is undefined. 
function loadDefaultPrefsIfNeeded(pref) 
{
    if ('undefined' === typeof(pref.defaults_loaded)) 
    {
        return loadDefaultPrefs();
    } 
    return Promise.resolve();
}

function loadDefaultPrefs()
{   
    let preferences = {};

    preferences.auto = false;
    preferences.random = false;
    preferences.startupSwitch = false;
    preferences.preview = false;
    preferences.iconPreview = true;
    preferences.toolsMenu = false;
    preferences.debug = false;
    preferences.fastSwitch = false;
    preferences.autoMinutes = 30;
    preferences.current = 0;
    preferences.currentThemeId = null;
    preferences.defaults_loaded = true; 

    return browser.storage.local.set(preferences);
}

var logger = console;
var nullLogger = {};
nullLogger.log = function () 
{ 
    return; 
};

function setLogger() 
{
    var checkIfDebugging = browser.storage.local.get("debug");
    return checkIfDebugging.then((pref) => 
    {
        if (true === pref.debug) 
        {
            logger = console;
        } 
        else 
        {
            logger = nullLogger;
        }        
        return Promise.resolve();
    });
}

function handleError(error) 
{
    logger.log(`${error}`);
}

browser.menus.onClicked.addListener((info) => 
{

    logger.log(`Context menu item clicked ${info.menuItemId}`);
    switch(info.menuItemId)
    {
        case "TMOptions":
            browser.runtime.openOptionsPage(); 
            break;
        case "ReloadThemes":
            rebuildMenus();
            break;
        default:
            toolsMenuThemeSelect(parseInt(info.menuItemId));
    }
});

browser.commands.onCommand.addListener(function(command) 
{
    logger.log(command);
    switch (command) {
        case "Switch to default theme":
            activateDefaultTheme();
            break;
        case "Rotate to next theme":
            rotate();
            break;
        case "Toggle autoswitching":
            browser.storage.local.get("auto").then((pref) => {
                browser.storage.local.set({'auto': !pref.auto})
                    .catch(handleError);
                logger.log(`Auto: ${!pref.auto}`);
                // give visual feedback
                if(pref.auto) rotate();
            });
            break;
        default:
            // should never get here
            logger.log(`${command} not recognized`);
            break;
    }
});

handleStartup();
