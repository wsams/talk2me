(function() {
    var Wwiki = {};

    Wwiki.render = function(str) {
        var fs = from.length;
        var ts = to.length;
        if (fs !== ts) {
            console.log("WARNING: Cannot perform wiki replacement - from and to do not match in size.");
            return str;
        }

        if (str !== undefined) {
            str = str.replace(/(\r|\n)/g, "abcdnewlineqwer");

            for (var i=0; i<fs; i++) {
                str = str.replace(from[i], to[i]);
            }

            str = str.replace(/abcdnewlineqwer/g, "\n");
        }

        return str;
    };

    var from = [
        /{youtube}\s*http.+v=([a-zA-Z0-9_-]+?)\s*?{\/youtube}/g, // embed youtube
        /{{\s*(http.+?)\s*}}/g, // image with css style set to 10%
        /{\s*(http.+?)\s*\|\s*(http.+?)\s*}/g, // image with alternate image link
        /{\s*(http.+?)\s*}/g, // image
        /{img:\s*(.+?)\s*\|\s*(http.+?)\s*}/g, // image with css style
        /\[\s*(http.+?)\s*\|\s*(.+?)\s*\]/g, // link with link text
        /\[\s*?(http.+?)\s*?\]/g, // link
        /'''(.+?)'''/g, // bold
        /''(.+?)''/g, // italics
        /{-(.+?)-}/g, // strikethrough
        /@@(.+?)@@/g, // code
        /{span:\s*(.+?)\s*}\s*(.*?)\s*{\/span}/g,
        /{div:\s*(.+?)\s*}\s*(.*?)\s*{\/div}/g,
        /{quote}\s*(.+?)\s*{\/quote}/g,
        /{site}\s*(.+?)\s*{\/site}/g,
        /{banner}\s*(.+?)\s*{\/banner}/g,
        /{code}\s*(.+?)\s*{\/code}/g,
        /{br}/g
        ];

    var to = [
        "<div class=\"video-container\"><iframe title=\"YouTube video player\" width=\"560\" height=\"315\" src=\"//www.youtube.com/embed/$1\" frameborder=\"0\" allowfullscreen></iframe></div><br /><a target=\"_blank\" href=\"https://youtu.be/$1\">$1</a>",
        "<a target=\"_blank\" href=\"$1\"><img class=\"img-responsive\" src=\"$1\" alt=\"$1\" style=\"border:0;\" /></a>",
        "<a target=\"_blank\" href=\"$2\"><img class=\"img-responsive\" src=\"$1\" alt=\"$1\" style=\"border:0;\" /></a>",
        "<a target=\"_blank\" href=\"$1\"><img class=\"img-responsive\" src=\"$1\" alt=\"$1\" style=\"border:0;\" /></a>",
        "<a target=\"_blank\" href=\"$2\"><img class=\"img-responsive\" src=\"$2\" alt=\"$2\" style=\"border:0; $1\" /></a>",
        "<a target=\"_blank\" href=\"$1\">$2</a>",
        "<a target=\"_blank\" href=\"$1\">$1</a>",
        "<strong>$1</strong>",
        "<em>$1</em>",
        "<span style='text-decoration:line-through'>$1</span>",
        "<code>$1</code>",
        "<span style=\"$1\">$2</span>",
        "<div style=\"$1\">$2</div>",
        "<blockquote>$1</blockquote>",
        "<iframe sandbox=\"allow-forms allow-scripts\" seamless=\"seamless\" src=\"$1\" style=\"width:100%; height:256px;\"></iframe>",
        "<div class=\"banner\">$1</div>",
        "<pre class=\"code\">$1</pre>",
        "<br />"
        ];

    window.Wwiki = Wwiki;

    if (typeof define === "function" && define.amd) {
        define(Wwiki);
    }

})();
