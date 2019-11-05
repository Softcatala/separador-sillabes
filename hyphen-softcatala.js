  var hyphenate=createHyphenator(hyphenationPatternsCa,{debug:true,hyphenChar:'_'});

  function onChangeFunction() {
    original_text = normalizeNFC(document.getElementById("text_to_hyphen").value);
    hyphenated_text = hyphenate(original_text)
      .replace(/(l·|ŀ)/g, "l")
      .replace(/(L·|Ŀ)/g, "L")
      .replace(/\bPius\b/g, "Pi_us")
      .replace(/à_cid pe_ri_ò_dic/g, "à_cid per_iò_dic");
    countSyllables(hyphenated_text);
    document.getElementById("result").innerHTML = hyphenated_text;
    document.getElementById("count").innerHTML = countSyllables(hyphenated_text) + " síl·labes";
  }

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
