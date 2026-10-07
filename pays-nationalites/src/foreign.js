// Words that are not answers but deserve a better reply than « pas dans la
// liste ». Spanish and English words a learner may type by reflex never score:
// the game only says which language slipped in, without giving the answer.
// French spellings that happen to match (Canada, Portugal, Sénégal…) are
// resolved as French before these lists are consulted.

export const SPANISH = [
  "reino unido", "inglaterra", "gran bretana", "britanico", "britanica", "ingles", "inglesa",
  "francia", "frances", "francesa",
  "belgica", "belga",
  "paises bajos", "holanda", "neerlandes", "neerlandesa", "holandes", "holandesa",
  "alemania", "aleman", "alemana",
  "suiza", "suizo",
  "italia", "italiano", "italiana",
  "grecia", "griego", "griega",
  "china", "chino",
  "japones", "japonesa",
  "india", "indio", "hindu",
  "australia", "australiano", "australiana",
  "espana", "espanol", "espanola",
  "marruecos", "marroqui",
  "senegales", "senegalesa",
  "costa de marfil", "marfileno", "marfilena",
  "argelia", "argelino", "argelina",
  "tunez", "tunecino", "tunecina",
  "estados unidos", "estadounidense", "americano", "americana",
  "mexico", "mexicano", "mexicana",
  "brasil", "brasileno", "brasilena",
  "argentina", "argentino",
  "canadiense",
  "portugues", "portuguesa",
];

export const ENGLISH = [
  "united kingdom", "england", "great britain", "british", "english",
  "french",
  "belgium", "belgian",
  "netherlands", "the netherlands", "holland", "dutch",
  "germany", "german",
  "switzerland", "swiss",
  "italy", "italian",
  "greece", "greek",
  "chinese",
  "japan", "japanese",
  "indian",
  "australian",
  "spain", "spanish",
  "morocco", "moroccan",
  "senegalese",
  "ivory coast", "ivorian",
  "algeria", "algerian",
  "tunisia", "tunisian",
  "united states", "the united states", "america", "american",
  "mexican",
  "brazil", "brazilian",
  "argentinian", "argentinean",
  "canadian",
  "portuguese",
];

// Correct French for countries and nationalities that are not on the map, so
// the game does not call them spelling mistakes.
export const ELSEWHERE = [
  "Russie", "russe", "Ukraine", "ukrainien", "ukrainienne", "Pologne", "polonais", "polonaise",
  "Autriche", "autrichien", "autrichienne", "Luxembourg", "luxembourgeois", "luxembourgeoise",
  "Irlande", "irlandais", "irlandaise", "Écosse", "écossais", "écossaise",
  "Suède", "suédois", "suédoise", "Norvège", "norvégien", "norvégienne",
  "Danemark", "danois", "danoise", "Finlande", "finlandais", "finlandaise",
  "Roumanie", "roumain", "roumaine", "Turquie", "turc", "turque",
  "Chili", "chilien", "chilienne", "Colombie", "colombien", "colombienne",
  "Pérou", "péruvien", "péruvienne", "Venezuela", "vénézuélien", "vénézuélienne",
  "Cuba", "cubain", "cubaine", "Équateur", "équatorien", "équatorienne",
  "Bolivie", "bolivien", "bolivienne", "Uruguay", "uruguayen", "uruguayenne",
  "Haïti", "haïtien", "haïtienne", "Guatemala", "guatémaltèque", "Costa Rica", "costaricien", "costaricienne",
  "Égypte", "égyptien", "égyptienne", "Libye", "libyen", "libyenne",
  "Cameroun", "camerounais", "camerounaise", "Mali", "malien", "malienne",
  "Niger", "nigérien", "nigérienne", "Nigeria", "nigérian", "nigériane",
  "Gabon", "gabonais", "gabonaise", "Congo", "congolais", "congolaise",
  "Madagascar", "malgache", "Ghana", "ghanéen", "ghanéenne", "Kenya", "kényan", "kényane",
  "Éthiopie", "éthiopien", "éthiopienne", "Afrique du Sud", "sud-africain", "sud-africaine",
  "Liban", "libanais", "libanaise", "Syrie", "syrien", "syrienne", "Israël", "israélien", "israélienne",
  "Iran", "iranien", "iranienne", "Irak", "irakien", "irakienne",
  "Arabie saoudite", "saoudien", "saoudienne", "Pakistan", "pakistanais", "pakistanaise",
  "Corée", "coréen", "coréenne", "Vietnam", "vietnamien", "vietnamienne",
  "Thaïlande", "thaïlandais", "thaïlandaise", "Indonésie", "indonésien", "indonésienne",
  "Philippines", "philippin", "philippine", "Nouvelle-Zélande", "néo-zélandais", "néo-zélandaise",
  "Angola", "angolais", "angolaise", "Togo", "togolais", "togolaise", "Bénin", "béninois", "béninoise",
  "Guinée", "guinéen", "guinéenne", "Tchad", "tchadien", "tchadienne", "Burkina Faso", "burkinabé",
  "Mauritanie", "mauritanien", "mauritanienne", "Rwanda", "rwandais", "rwandaise",
  "Burundi", "burundais", "burundaise", "Hongrie", "hongrois", "hongroise", "Croatie", "croate",
  "Tchéquie", "tchèque", "Bulgarie", "bulgare", "Serbie", "serbe", "Islande", "islandais", "islandaise",
  "Afghanistan", "afghan", "afghane", "Népal", "népalais", "népalaise", "Bangladesh", "bangladais", "bangladaise",
  "Jamaïque", "jamaïcain", "jamaïcaine", "Panama", "panaméen", "panaméenne",
  "Honduras", "hondurien", "hondurienne", "Nicaragua", "nicaraguayen", "nicaraguayenne",
  "Salvador", "salvadorien", "salvadorienne", "Paraguay", "paraguayen", "paraguayenne",
];

// Continents are on the map, but they are not countries.
export const CONTINENTS = [
  "Afrique", "africain", "africaine", "Europe", "européen", "européenne", "Asie", "asiatique",
  "Océanie", "océanien", "océanienne", "Amérique du Nord", "Amérique du Sud", "Amérique latine",
  "sud-américain", "sud-américaine", "latino-américain", "latino-américaine",
];
