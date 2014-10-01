(function($){

    function getURLParameter(param) {
        var pageURL = window.location.search.substring(1);
        var URLVars = pageURL.split('&');
        for (var i = 0; i < URLVars.length; i++)
        {
            var paramName = URLVars[i].split('=');
            if (paramName[0] == param)
            {
                return paramName[1];
            }
        }
    }

    $(document).ready(function(){
        var debug = getURLParameter('debug');
        debug = debug === '1' ? true : false;

        $('#animation-cache a').circularText({
            debug: debug,
            cache: true,
            animate: true,
            cacheId: 'a'
        });
        $('#animation-no-cache a').circularText({
            debug: debug,
            cache: false,
            animate: true,
            cacheId: 'b'
        });
        $('#no-animation-no-cache a').circularText({
            debug: debug,
            cacheId: 'c'
        });
            });
})(jQuery);
