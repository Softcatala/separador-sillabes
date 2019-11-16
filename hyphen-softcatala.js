var hyphenate = createHyphenator(hyphenationPatternsCa, {
    debug: true,
    hyphenChar: '_'
});

String.prototype.lines = function() { return this.split(/\r*\n/); }
String.prototype.lineCount = function() { return this.lines().filter(String).length; }

String.prototype.adjustHyphenatedText = function() {
    return this.replace(/(l·|ŀ)/g, "l")
        .replace(/(L·|Ŀ)/g, "L")
        .replace(/\bPius\b/g, "Pi_us")
        .replace(/à_cid pe_ri_ò_dic/g, "à_cid per_iò_dic");
}

onChangeFunction(); //first time

function onChangeFunction() {
    var original_text = normalizeNFC(document.getElementById("text_to_hyphen").value.trim()).replace(/_/g, " ");
    var lc = original_text.lineCount();
    if (lc < 1) {
        return;
    } else if ( lc == 1) {
        hyphenated_text = hyphenate(original_text).adjustHyphenatedText();
        document.getElementById("result").innerHTML = getMessageOneLine(hyphenated_text);
    } else if (lc > 1) {
        document.getElementById("result").innerHTML = getMessageMultipleLines(original_text);
    }

    // show warnings
    var hintStr = "";
    var ambiguities = checkAmbiguities(original_text)
    if (ambiguities.count >= 1) {
        hintStr = "<br/>";
        if (ambiguities.count == 1) {
            hintStr += "Partició sil·làbica dubtosa\n<ul>\n"
        } else hintStr += "Particions sil·làbiques dubtoses\n<ul>\n"
        hintStr += ambiguities.hints;
        hintStr += "</ul>\n"
        //hintStr+="<br/><br/>";
        document.getElementById("warning").innerHTML = hintStr;
        document.getElementById("warning").style.display = "inline";
    } else document.getElementById("warning").style.display = "none";
}


function getResultLine(s) {
    var words = s.split(/[^a-zàáèéìíòóùúäëïöüç·ñ'’ŀâêîôû_-]/i);
    words = words.filter(String);
    wl = words.length;
    if (wl === 0) {
        return "";
    }
    var new_hyphen_text = "";
    var i;
    // compta amb sinalefes i elisions
    for (i = 0; i < wl - 1; i++) {
        new_hyphen_text += words[i].toString();
        if (words[i].match(/[aeiouàèìòùáéíóúïü]$/i) && !words[i].match(/([aeio][iu]|^[^q]*ui)$/i) && words[i + 1].match(/^h?[aeiouàèìòùáéíóúïü]/i) && !words[i + 1].match(/^h?[iu][aeiouàèìòùáéíóúïü]/i)) {
            new_hyphen_text = new_hyphen_text.replace(/‿(h[io])$/i, ' $1');
            new_hyphen_text += "‿";
        } else {
            new_hyphen_text += " ";
        }
        new_hyphen_text = new_hyphen_text.replace(/([_-][^aeiou]*[eiïa])(-h[io][ ‿])$/i, '$1‿$2');
        new_hyphen_text = new_hyphen_text.replace(/(‿-h[io])‿$/i, '$1 ');
    }
    new_hyphen_text += words[wl - 1].toString();
    new_hyphen_text = new_hyphen_text.replace(/([_-][^aeiou]*[eiïa])(-h[io])$/i, '$1‿$2');

    //última paraula
    lastword = words[wl - 1].toString();
    numlastword = classifyWord(lastword);

    // sinalefa després de l'última síl·laba tònica
    var sinalefa_final = 0;
    if (lastword.match(/([_-][^aeiou]*[eiïa])(-h[io])$/)) {
        sinalefa_final = 1;
    }

    syllables = s.split(/[^a-zàáèéìíòóùúäëïöüç·ñ'’ŀâêîôû]/i);
    syllables2 = new_hyphen_text.replace(/‿-/, "‿").split(/[^a-zàáèéìíòóùúäëïöüç·ñ'’ŀâêîôû‿]/i);

    numsyl = syllables.filter(String).length;
    numsyl2 = syllables2.filter(String).length;

    return {
        hyphenated_line: new_hyphen_text.replace(/_/g, '|').replace(/ /g, "&nbsp;&nbsp;"),
        count_graphical: numsyl,
        count_phonetical: numsyl2,
        count_poetical1: numsyl + numlastword,
        count_poetical2: numsyl2 + numlastword + sinalefa_final
    }
}

function getMessageOneLine(s) {
    var r = getResultLine(s);
    if (r.count_graphical === 0) {
        return "";
    }
    var result = "";
    result += r.hyphenated_line;
    result += "<br/><br/>";
    result += "Recompte gràfic: " + r.count_graphical + sillabes(r.count_graphical) + "<br/>";
    result += "Recompte fonètic: " + r.count_phonetical + sillabes(r.count_phonetical) + " (amb elisions i sinalefes)<br/>";
    result += "Recompte poètic: ";
    result += (r.count_poetical1);
    if (r.count_poetical1 != r.count_poetical2) {
        result += " (" + r.count_poetical2 + ")";
    }
    result += sillabes(r.count_poetical1) + " (fins a l'última síl·laba tònica)<br/>";
    return result;
}

function getMessageMultipleLines(s){
    var lines = s.lines().filter(String);
    var i = 0;
    var result = lines.length + " versos";
    result += '<table>\n';
    for (i = 0; i < lines.length; i++) {
        var r = getResultLine(hyphenate(lines[i]).adjustHyphenatedText());
        result += "<tr><td>";
        result += (r.count_poetical1);
        if (r.count_poetical1 != r.count_poetical2) {
            result += " (" + r.count_poetical2 + ")";
        }
        result += "</td><td>";
        result += r.hyphenated_line;
        result += "</td></tr>";
    }
    result += '</table>';
    return result;
}

function sillabes(i) {
    if (i === 1) {
        return " síl·laba";
    } else {
        return " síl·labes";
    }
}

function classifyWord(word) {
    var w = word.trim();
    //    if (!w.matches(/_/)) {
    //    w = hyphenate(w);
    //    }

    //elimina pronoms febles
    var syl_removed = 0;
    while (w.match(/(['’]en|['’]hi|['’]ho|['’]l|['’]ls|['’]m|['’]n|['’]ns|['’]s|['’]t|-el|-els|-em|-en|-ens|-hi|-ho|-l|-la|-les|-li|-lo|-los|-m|-me|-n|-ne|-nos|-s|-se|-t|-te|-us|-vos)$/)) {
        if (w.match(/(['’]en|['’]hi|['’]ho|-el|-els|-em|-en|-ens|-hi|-ho|-la|-les|-li|-lo|-los|-me|-ne|-nos|-se|-te|-us|-vos)$/)) {
            syl_removed++;
        }
        w = w.replace(/(['’]en|['’]hi|['’]ho|['’]l|['’]ls|['’]m|['’]n|['’]ns|['’]s|['’]t|-el|-els|-em|-en|-ens|-hi|-ho|-l|-la|-les|-li|-lo|-los|-m|-me|-n|-ne|-nos|-s|-se|-t|-te|-us|-vos)$/, "");
    }


    syll = w.split(/_/);
    ns = syll.filter(String).length;
    r = 0;
    if (ns === 0) {
        return 0;
    } //empty word
    else if (ns === 1) {
        r = 0;
    } // aguda
    else if (ns > 2 && syll[ns - 3].match(/[àáèéìíòóùú]/i)) {
        r = -2;
    } //esdrúixola
    else if (syll[ns - 2].match(/[àáèéìíòóùú]/i)) {
        r = -1;
    } //plana
    else if (syll[ns - 1].match(/[àáèéìíòóùú]/i)) {
        r = 0;
    } //aguda
    else if (syll[ns - 1].match(/[aeo][iu][^aeiou]*$/i)) {
        r = 0;
    } // aguda (amb diftong)
    else if (syll[ns - 1].match(/([eiï]n|[aeiouï]s?)$/i)) {
        r = -1;
    } //plana
    else r = 0; //aguda
    return r - syl_removed;
}

function normalizeNFC(userText) {
    var normalizedText = userText;
    if (String.prototype.hasOwnProperty('normalize')) {
        normalizedText = userText.normalize("NFC");
    }
    return normalizedText;
}

function checkAmbiguities(s) {
    var checks = [{
            re: "\\baguant\\b",
            cs: "i",
            state: 0,
            hint: "La partició del mot \"aguant\" pot ser \"a_gu_ant\" (del verb \"aguar\") o \"a_guant\" (substantiu o forma verbal del verb \"aguantar\")"
        },
        {
            re: "\\bpair\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"pair\" tant pot ser del verb \"pair\", i la partició seria \"pa_ir\", com del verb \"pairar\", i aleshores seria \"pair\"."
        },
        {
            re: "\\bduumvir[a-z]*\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix una partició diferent per a \"duumvir\" i derivats."
        },
        {
            re: "\\bpairem\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"pairem\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_rem\", com del verb \"pairar\", i aleshores seria \"pai_rem\"."
        },
        {
            re: "\\bpaireu\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"paireu\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_reu\", com del verb \"pairar\", i aleshores seria \"pai_reu\"."
        },
        {
            re: "\\bpairen\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"pairen\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_ren\", com del verb \"pairar\", i aleshores seria \"pai_ren\"."
        },
        {
            re: "\\bpairàs\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"pairàs\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_ràs\", com del verb \"pairar\", i aleshores seria \"pai_ràs\"."
        },
        {
            re: "\\bperiòdi(c|cs|ca|ques)\\b",
            cs: "i",
            state: 0,
            hint: "La partició del mot \"periòdic\" pot ser \"pe_ri_ò_dic\", de període, o \"per_iò_dic\", d'àcid periòdic."
        },
        {
            re: "\\b(Pius|PIUS)\\b",
            cs: "",
            state: 0,
            hint: "El nom propi \"Pius\" té la partició \"Pi_us\", però el substantiu plural \"pius\" és monosil·làbic."
        },
        //{re:"\\bshakespear(e|ià|ians|iana|ianes)\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix una partició diferent per a \"Shakespeare\" i derivats."},
        {
            re: "\\btrair\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"trair\" tant pot ser del verb \"trair\", i la partició seria \"tra_ir\", com del verb \"trairar\", i aleshores seria \"trair\"."
        },
        {
            re: "\\btrairem\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"trairem\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_rem\", com del verb \"trairar\", i aleshores seria \"trai_rem\"."
        },
        {
            re: "\\btraireu\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"traireu\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_reu\", com del verb \"trairar\", i aleshores seria \"trai_reu\"."
        },
        {
            re: "\\btrairen\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"trairen\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_ren\", com del verb \"trairar\", i aleshores seria \"trai_ren\"."
        },
        {
            re: "\\btrairàs\\b",
            cs: "i",
            state: 0,
            hint: "La forma verbal \"trairàs\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_ràs\", com del verb \"trairar\", i aleshores seria \"trai_ràs\"."
        },
        {
            re: "\\bzimbabuès\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix zim_ba_buès."
        },
        {
            re: "\\bzimbabués\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix zim_ba_bués."
        },
        {
            re: "\\bzimbabuesa\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix zim_ba_bue_sa."
        },
        {
            re: "\\bzimbabueses\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix zim_ba_bue_ses."
        },
        {
            re: "\\bzimbabuesos\\b",
            cs: "i",
            state: 0,
            hint: "L'Enciclopèdia Catalana suggereix zim_ba_bue_sos."
        }
    ];

    var output = {
        count: 0,
        hints: ""
    };

    for (i = 0; i < checks.length; i++) {
        var re = new RegExp(checks[i].re, checks[i].cs);

        if (re.test(s)) {
            output.count += 1;
            output.hints += "<li>" + checks[i].hint + "</li>\n";
        }
    }

    return output;
}