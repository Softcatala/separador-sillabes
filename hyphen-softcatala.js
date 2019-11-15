  var hyphenate=createHyphenator(hyphenationPatternsCa,{debug:true,hyphenChar:'_'});

  onChangeFunction(); //first time

  function onChangeFunction() {
    original_text = normalizeNFC(document.getElementById("text_to_hyphen").value);
    hyphenated_text = hyphenate(original_text)
      .replace(/(l·|ŀ)/g, "l")
      .replace(/(L·|Ŀ)/g, "L")
      .replace(/\bPius\b/g, "Pi_us")
      .replace(/à_cid pe_ri_ò_dic/g, "à_cid per_iò_dic");
    countSyllables(hyphenated_text);
    document.getElementById("result").innerHTML = hyphenated_text;
    var count = countSyllables(hyphenated_text);
    var syllablesStr = " síl·labes";
    if (count === 1) {
      syllablesStr = " síl·laba";
    }
    document.getElementById("count").innerHTML = count + syllablesStr;
	
	var hintStr = "";
	var ambiguities = checkAmbiguities(original_text)
	
	if (ambiguities.count >= 1) {
		hintStr = "<br/>";
		if (ambiguities.count == 1) {
			hintStr += "Partició sil·làbica dubtosa\n<ul>\n"
		}
		else hintStr += "Particions sil·làbiques dubtoses\n<ul>\n"		
		hintStr += ambiguities.hints;
 		hintStr += "</ul>\n"
		//hintStr+="<br/><br/>";
		document.getElementById("warning").innerHTML = hintStr;		
		document.getElementById("warning").style.display = "inline";
	} else document.getElementById("warning").style.display = "none";
  }
; 
  function countSyllables(s) {
    words = s.split(/[^a-zàáèéìíòóùúäëïöüç·ñ'’ŀâêîôû]/i);
    return words.filter(String).length;
  }

  function normalizeNFC(userText) {
    var normalizedText = userText;
    if (String.prototype.hasOwnProperty('normalize')) {
      normalizedText = userText.normalize("NFC");
    }
    return normalizedText;
  }

  function checkAmbiguities(s) {
	var checks = [
		{re:"\\baguant\\b", cs:"i", state:0, hint:"La partició del mot \"aguant\" pot ser \"a_gu_ant\" (del verb \"aguar\") o \"a_guant\" (substantiu o forma verbal del verb \"aguantar\")"},
		{re:"\\bpair\\b", cs:"i", state:0, hint:"La forma verbal \"pair\" tant pot ser del verb \"pair\", i la partició seria \"pa_ir\", com del verb \"pairar\", i aleshores seria \"pair\"."},
		{re:"\\bduumvir[a-z]*\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix una partició diferent per a \"duumvir\" i derivats."},
		{re:"\\bpairem\\b", cs:"i", state:0, hint:"La forma verbal \"pairem\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_rem\", com del verb \"pairar\", i aleshores seria \"pai_rem\"."},
		{re:"\\bpaireu\\b", cs:"i", state:0, hint:"La forma verbal \"paireu\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_reu\", com del verb \"pairar\", i aleshores seria \"pai_reu\"."},
		{re:"\\bpairen\\b", cs:"i", state:0, hint:"La forma verbal \"pairen\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_ren\", com del verb \"pairar\", i aleshores seria \"pai_ren\"."},
		{re:"\\bpairàs\\b", cs:"i", state:0, hint:"La forma verbal \"pairàs\" tant pot ser del verb \"pair\", i la partició seria \"pa_i_ràs\", com del verb \"pairar\", i aleshores seria \"pai_ràs\"."},
		{re:"\\bperiòdi(c|cs|ca|ques)\\b", cs:"i", state:0, hint:"La partició del mot \"periòdic\" pot ser \"pe_ri_ò_dic\", de període, o \"per_iò_dic\", d'àcid periòdic."},
		{re:"\\b(Pius|PIUS)\\b", cs:"", state:0, hint:"El nom propi \"Pius\" té la partició \"Pi_us\", però el substantiu plural \"pius\" és monosil·làbic."},
		//{re:"\\bshakespear(e|ià|ians|iana|ianes)\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix una partició diferent per a \"Shakespeare\" i derivats."},
		{re:"\\btrair\\b", cs:"i", state:0, hint:"La forma verbal \"trair\" tant pot ser del verb \"trair\", i la partició seria \"tra_ir\", com del verb \"trairar\", i aleshores seria \"trair\"."},
		{re:"\\btrairem\\b", cs:"i", state:0, hint:"La forma verbal \"trairem\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_rem\", com del verb \"trairar\", i aleshores seria \"trai_rem\"."},
		{re:"\\btraireu\\b", cs:"i", state:0, hint:"La forma verbal \"traireu\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_reu\", com del verb \"trairar\", i aleshores seria \"trai_reu\"."},
		{re:"\\btrairen\\b", cs:"i", state:0, hint:"La forma verbal \"trairen\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_ren\", com del verb \"trairar\", i aleshores seria \"trai_ren\"."},
		{re:"\\btrairàs\\b", cs:"i", state:0, hint:"La forma verbal \"trairàs\" tant pot ser del verb \"trair\", i la partició seria \"tra_i_ràs\", com del verb \"trairar\", i aleshores seria \"trai_ràs\"."},
		{re:"\\bzimbabuès\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix zim_ba_buès."},
		{re:"\\bzimbabués\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix zim_ba_bués."},
		{re:"\\bzimbabuesa\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix zim_ba_bue_sa."},
		{re:"\\bzimbabueses\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix zim_ba_bue_ses."},
		{re:"\\bzimbabuesos\\b", cs:"i", state:0, hint:"L'Enciclopèdia Catalana suggereix zim_ba_bue_sos."}
	];

	var output = {
		count: 0,
		hints: ""
	};
	
	for (i = 0; i < checks.length; i++) {
		var re = new RegExp(checks[i].re,checks[i].cs);
		
		if (re.test(s)) {
			output.count += 1;
			output.hints += "<li>" + checks[i].hint + "</li>\n";
		}
	}
 		
	return output;
  }
 
