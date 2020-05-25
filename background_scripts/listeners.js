/* global browser, logger, stopRotateAlarm, startRotateAlarm, switchTheme,
   setCurrentTheme, startThemePreview, endThemePreview,
   updateBrowserActionSelection, updateToolsMenuSelection */


var previewAlarmListener;

var clickListener = function(theTheme, theIndex) 
{ 
    return function() 
    {
        stopRotateAlarm(); 
        browser.storage.local.get("current").then((result) => 
            {
                logger.log(`Switching from ${result.current} to ${theIndex}`);
                switchTheme(theTheme.id, result.current);
                setCurrentTheme(theIndex, result.current);
                updateBrowserActionSelection(theIndex, result.current);
                updateToolsMenuSelection(theIndex, result.current);
            });
        startRotateAlarm(); 
    };
};

var mouseEnterListener = function(theTheme, preview) {
    return function() { 
        if(preview) {
            startThemePreview(theTheme);
        }
    };
};

var mouseLeaveListener = function(elementClass, preview) { 
    return function() { 
        if(preview) {
            if('browserActionMenu' === elementClass) {
                endThemePreview();
            } 
        }
    };
};
