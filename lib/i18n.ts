import type { Language } from '@/lib/types';

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  de: 'German',
  nl: 'Dutch',
  pt: 'Portuguese',
  es: 'Spanish',
  fr: 'French',
  bg: 'Bulgarian',
  tr: 'Turkish',
};

type MessageKey =
  | 'chatNoSpecificInfo'
  | 'compareInsufficientContext'
  | 'journeyLimitedInfo'
  | 'journeyMissingCoverage'
  | 'journeyVerifyRequirements'
  | 'compareExcludedCountry'
  | 'compareMissingStructuredCountry'
  | 'compareNoGroundedOutput'
  | 'journeyMissingPhases'
  | 'journeyLimitedCoverage'
  | 'journeyNoStrongGrounding';

type MessageBuilder = (params?: Record<string, string>) => string;

const messages: Record<Language, Record<MessageKey, MessageBuilder>> = {
  en: {
    chatNoSpecificInfo: ({ country = 'this country' } = {}) =>
      `I don't have specific information about this procedure yet. Please check the official government website for ${country}.`,
    compareInsufficientContext: () =>
      'I do not have enough official source context to compare these countries reliably yet. Please narrow the question or verify on official government websites.',
    journeyLimitedInfo: ({ country = 'this country' } = {}) =>
      `Limited official procedure information is currently available for ${country}.`,
    journeyMissingCoverage: ({ areas = 'the relevant procedure areas' } = {}) =>
      `Missing grounded coverage for: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Verify visa, registration, and permit requirements on official government websites before acting.',
    compareExcludedCountry: ({ code = 'This country' } = {}) =>
      `${code} was excluded because official source coverage was too weak for a reliable comparison.`,
    compareMissingStructuredCountry: ({ code = 'This country' } = {}) =>
      `${code} had source coverage but did not produce a sufficiently grounded structured comparison entry.`,
    compareNoGroundedOutput: () =>
      'I do not have enough grounded country-specific output to compare these options reliably.',
    journeyMissingPhases: ({ phases = 'some phases' } = {}) =>
      `Some expected roadmap phases were missing from the model output and were reinserted as empty placeholders: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'some areas' } = {}) =>
      `Some parts of this plan rely on limited official source coverage. Double-check these areas on official sources: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'No journey areas were strongly grounded in official source context.',
  },
  de: {
    chatNoSpecificInfo: ({ country = 'dieses Land' } = {}) =>
      `Ich habe noch keine konkreten Informationen zu diesem Verfahren. Bitte pruefen Sie die offizielle Website von ${country}.`,
    compareInsufficientContext: () =>
      'Ich habe noch nicht genug offiziellen Quellenkontext, um diese Laender verlaesslich zu vergleichen. Bitte praezisieren Sie die Frage oder pruefen Sie offizielle Regierungswebsites.',
    journeyLimitedInfo: ({ country = 'dieses Land' } = {}) =>
      `Derzeit sind nur begrenzte offizielle Verfahrensinformationen fuer ${country} verfuegbar.`,
    journeyMissingCoverage: ({ areas = 'relevante Bereiche' } = {}) =>
      `Fehlende belastbare Abdeckung fuer: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Pruefen Sie Visum-, Melde- und Genehmigungsanforderungen auf offiziellen Regierungswebsites, bevor Sie handeln.',
    compareExcludedCountry: ({ code = 'Dieses Land' } = {}) =>
      `${code} wurde ausgeschlossen, weil die offizielle Quellenlage fuer einen verlaesslichen Vergleich zu schwach war.`,
    compareMissingStructuredCountry: ({ code = 'Dieses Land' } = {}) =>
      `${code} hatte Quellenabdeckung, lieferte aber keinen ausreichend belastbaren strukturierten Vergleichseintrag.`,
    compareNoGroundedOutput: () =>
      'Ich habe nicht genug belastbare laenderspezifische Ausgaben, um diese Optionen verlaesslich zu vergleichen.',
    journeyMissingPhases: ({ phases = 'einige Phasen' } = {}) =>
      `Einige erwartete Roadmap-Phasen fehlten in der Modellausgabe und wurden als leere Platzhalter wieder eingefuegt: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'einige Bereiche' } = {}) =>
      `Einige Teile dieses Plans beruhen auf begrenzter offizieller Quellenabdeckung. Pruefen Sie diese Bereiche in offiziellen Quellen: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Keine Bereiche der Umzugsplanung waren stark in offiziellem Quellenkontext verankert.',
  },
  nl: {
    chatNoSpecificInfo: ({ country = 'dit land' } = {}) =>
      `Ik heb nog geen specifieke informatie over deze procedure. Controleer de officiele overheidswebsite voor ${country}.`,
    compareInsufficientContext: () =>
      'Ik heb nog niet genoeg officiele broncontext om deze landen betrouwbaar te vergelijken. Maak de vraag specifieker of controleer officiele overheidswebsites.',
    journeyLimitedInfo: ({ country = 'dit land' } = {}) =>
      `Er is momenteel beperkte officiele procedure-informatie beschikbaar voor ${country}.`,
    journeyMissingCoverage: ({ areas = 'relevante onderdelen' } = {}) =>
      `Ontbrekende onderbouwde dekking voor: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Controleer visum-, registratie- en vergunningsvereisten op officiele overheidswebsites voordat je handelt.',
    compareExcludedCountry: ({ code = 'Dit land' } = {}) =>
      `${code} is uitgesloten omdat de officiele brondekking te zwak was voor een betrouwbare vergelijking.`,
    compareMissingStructuredCountry: ({ code = 'Dit land' } = {}) =>
      `${code} had brondekking, maar leverde geen voldoende onderbouwde gestructureerde vergelijking op.`,
    compareNoGroundedOutput: () =>
      'Ik heb niet genoeg onderbouwde landspecifieke output om deze opties betrouwbaar te vergelijken.',
    journeyMissingPhases: ({ phases = 'enkele fasen' } = {}) =>
      `Sommige verwachte roadmap-fasen ontbraken in de modeluitvoer en zijn opnieuw ingevoegd als lege placeholders: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'enkele onderdelen' } = {}) =>
      `Sommige delen van dit plan steunen op beperkte officiele brondekking. Controleer deze onderdelen in officiele bronnen: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Geen onderdelen van het verhuisplan waren sterk onderbouwd met officiele broncontext.',
  },
  pt: {
    chatNoSpecificInfo: ({ country = 'este pais' } = {}) =>
      `Ainda nao tenho informacoes especificas sobre este procedimento. Verifique o site oficial do governo de ${country}.`,
    compareInsufficientContext: () =>
      'Ainda nao tenho contexto oficial suficiente para comparar estes paises de forma fiavel. Restrinja a pergunta ou verifique sites oficiais do governo.',
    journeyLimitedInfo: ({ country = 'este pais' } = {}) =>
      `As informacoes oficiais sobre procedimentos para ${country} estao atualmente limitadas.`,
    journeyMissingCoverage: ({ areas = 'as areas relevantes' } = {}) =>
      `Cobertura fundamentada ausente para: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Verifique os requisitos de visto, registo e autorizacao em sites oficiais do governo antes de agir.',
    compareExcludedCountry: ({ code = 'Este pais' } = {}) =>
      `${code} foi excluido porque a cobertura de fontes oficiais era demasiado fraca para uma comparacao fiavel.`,
    compareMissingStructuredCountry: ({ code = 'Este pais' } = {}) =>
      `${code} tinha cobertura de fontes, mas nao produziu uma entrada estruturada suficientemente fundamentada.`,
    compareNoGroundedOutput: () =>
      'Nao tenho saida especifica por pais suficientemente fundamentada para comparar estas opcoes de forma fiavel.',
    journeyMissingPhases: ({ phases = 'algumas fases' } = {}) =>
      `Algumas fases esperadas do plano estavam ausentes na resposta do modelo e foram reinseridas como marcadores vazios: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'algumas areas' } = {}) =>
      `Algumas partes deste plano dependem de cobertura limitada de fontes oficiais. Confirme estas areas em fontes oficiais: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Nenhuma area do plano de mudanca estava fortemente fundamentada em contexto oficial.',
  },
  es: {
    chatNoSpecificInfo: ({ country = 'este pais' } = {}) =>
      `Todavia no tengo informacion especifica sobre este procedimiento. Consulta el sitio web oficial del gobierno de ${country}.`,
    compareInsufficientContext: () =>
      'Todavia no tengo suficiente contexto de fuentes oficiales para comparar estos paises de forma fiable. Acota la pregunta o verifica en sitios web oficiales del gobierno.',
    journeyLimitedInfo: ({ country = 'este pais' } = {}) =>
      `Actualmente hay informacion oficial limitada sobre procedimientos para ${country}.`,
    journeyMissingCoverage: ({ areas = 'las areas relevantes' } = {}) =>
      `Falta cobertura fundamentada para: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Verifica los requisitos de visado, registro y permisos en sitios web oficiales del gobierno antes de actuar.',
    compareExcludedCountry: ({ code = 'Este pais' } = {}) =>
      `${code} fue excluido porque la cobertura de fuentes oficiales era demasiado debil para una comparacion fiable.`,
    compareMissingStructuredCountry: ({ code = 'Este pais' } = {}) =>
      `${code} tenia cobertura de fuentes, pero no produjo una entrada estructurada suficientemente fundamentada.`,
    compareNoGroundedOutput: () =>
      'No tengo suficiente salida especifica por pais y bien fundamentada para comparar estas opciones con fiabilidad.',
    journeyMissingPhases: ({ phases = 'algunas fases' } = {}) =>
      `Faltaban algunas fases esperadas de la hoja de ruta en la salida del modelo y se volvieron a insertar como marcadores vacios: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'algunas areas' } = {}) =>
      `Algunas partes de este plan dependen de una cobertura limitada de fuentes oficiales. Verifica estas areas en fuentes oficiales: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Ninguna area del plan de reubicacion estaba fuertemente fundamentada en contexto oficial.',
  },
  fr: {
    chatNoSpecificInfo: ({ country = 'ce pays' } = {}) =>
      `Je n'ai pas encore d'informations specifiques sur cette procedure. Veuillez consulter le site officiel du gouvernement de ${country}.`,
    compareInsufficientContext: () =>
      `Je n'ai pas encore assez de contexte provenant de sources officielles pour comparer ces pays de maniere fiable. Precisez la question ou verifiez les sites officiels du gouvernement.`,
    journeyLimitedInfo: ({ country = 'ce pays' } = {}) =>
      `Les informations officielles sur les procedures pour ${country} sont actuellement limitees.`,
    journeyMissingCoverage: ({ areas = 'les domaines pertinents' } = {}) =>
      `Couverture etayee manquante pour : ${areas}.`,
    journeyVerifyRequirements: () =>
      `Verifiez les exigences en matiere de visa, d'enregistrement et d'autorisations sur les sites officiels du gouvernement avant d'agir.`,
    compareExcludedCountry: ({ code = 'Ce pays' } = {}) =>
      `${code} a ete exclu car la couverture des sources officielles etait trop faible pour une comparaison fiable.`,
    compareMissingStructuredCountry: ({ code = 'Ce pays' } = {}) =>
      `${code} disposait de sources, mais n'a pas produit une entree de comparaison structuree suffisamment etayee.`,
    compareNoGroundedOutput: () =>
      `Je n'ai pas assez de contenu specifique aux pays et suffisamment etaye pour comparer ces options de maniere fiable.`,
    journeyMissingPhases: ({ phases = 'certaines phases' } = {}) =>
      `Certaines phases attendues de la feuille de route manquaient dans la sortie du modele et ont ete reinserees comme espaces reserves vides : ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'certains domaines' } = {}) =>
      `Certaines parties de ce plan reposent sur une couverture limitee de sources officielles. Verifiez ces domaines dans des sources officielles : ${areas}.`,
    journeyNoStrongGrounding: () =>
      `Aucun domaine du plan de relocalisation n'etait fortement etaye par un contexte officiel.`,
  },
  bg: {
    chatNoSpecificInfo: ({ country = 'tazi darzhava' } = {}) =>
      `Vse oshte nyamam konkretna informaciya za tazi procedura. Molya, proverete oficialniya pravitelstven sait za ${country}.`,
    compareInsufficientContext: () =>
      'Vse oshte nyamam dostatachno kontekst ot oficialni iztochnici, za da sravnya nadezhdno tezi darzhavi. Ogranichete vaprosa ili proverete oficialni pravitelstveni saitove.',
    journeyLimitedInfo: ({ country = 'tazi darzhava' } = {}) =>
      `V momenta ima ogranichena oficialna informaciya za proceduri za ${country}.`,
    journeyMissingCoverage: ({ areas = 'relevantnite oblasti' } = {}) =>
      `Lipsva podkrepeno pokritie za: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Proverete iziskvaniyata za viza, registraciya i razreshitelni v oficialni pravitelstveni saitove, predi da deistvate.',
    compareExcludedCountry: ({ code = 'Tazi darzhava' } = {}) =>
      `${code} beshe izklyuchena, zashtoto pokritieto ot oficialni iztochnici e tvarde slabo za nadezhdno sravnenie.`,
    compareMissingStructuredCountry: ({ code = 'Tazi darzhava' } = {}) =>
      `${code} imashe pokritie ot iztochnici, no ne proizvede dostatachno podkrepen strukturiran zapis za sravnenie.`,
    compareNoGroundedOutput: () =>
      'Nyamam dostatachno podkrepen izlaz po darzhavi, za da sravnya tezi opcii nadezhdno.',
    journeyMissingPhases: ({ phases = 'nyakoi fazi' } = {}) =>
      `Nyakoi ochakvani fazi ot plana lipsvaha v modelniya rezultat i byaha vmaknati otnovo kato prazni zamestiteli: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'nyakoi oblasti' } = {}) =>
      `Nyakoi chasti ot tozi plan razchitat na ogranicheno pokritie ot oficialni iztochnici. Proverete tezi oblasti v oficialni iztochnici: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Nito edna oblast ot plana za premestvane ne beshe silno podkrepena s oficialen kontekst.',
  },
  tr: {
    chatNoSpecificInfo: ({ country = 'bu ulke' } = {}) =>
      `Bu prosedur hakkinda henuz ozel bilgiye sahip degilim. Lutfen ${country} icin resmi devlet web sitesini kontrol edin.`,
    compareInsufficientContext: () =>
      `Bu ulkeleri guvenilir bicimde karsilastirmak icin henuz yeterli resmi kaynak baglamina sahip degilim. Soruyu daraltin veya resmi devlet sitelerini kontrol edin.`,
    journeyLimitedInfo: ({ country = 'bu ulke' } = {}) =>
      `${country} icin resmi prosedur bilgileri su anda sinirlidir.`,
    journeyMissingCoverage: ({ areas = 'ilgili alanlar' } = {}) =>
      `Su alanlar icin dayanakli kapsam eksik: ${areas}.`,
    journeyVerifyRequirements: () =>
      'Harekete gecmeden once vize, kayit ve izin gerekliliklerini resmi devlet sitelerinde dogrulayin.',
    compareExcludedCountry: ({ code = 'Bu ulke' } = {}) =>
      `${code}, guvenilir bir karsilastirma icin resmi kaynak kapsami cok zayif oldugu icin dislandi.`,
    compareMissingStructuredCountry: ({ code = 'Bu ulke' } = {}) =>
      `${code} kaynak kapsamina sahipti ancak yeterince dayanakli yapilandirilmis bir karsilastirma girdisi uretmedi.`,
    compareNoGroundedOutput: () =>
      'Bu secenekleri guvenilir bicimde karsilastirmak icin yeterli dayanakli ulkeye ozgu cikti yok.',
    journeyMissingPhases: ({ phases = 'bazi asamalar' } = {}) =>
      `Beklenen yol haritasi asamalarindan bazilari model cikisinda yoktu ve bos yer tutucular olarak yeniden eklendi: ${phases}.`,
    journeyLimitedCoverage: ({ areas = 'bazi alanlar' } = {}) =>
      `Bu planin bazi kisimlari sinirli resmi kaynak kapsamina dayaniyor. Su alanlari resmi kaynaklarda yeniden kontrol edin: ${areas}.`,
    journeyNoStrongGrounding: () =>
      'Tasinma planinin hicbir alani resmi kaynak baglami ile guclu sekilde desteklenmedi.',
  },
};

export function getLanguageName(language?: string): string {
  if (!language) {
    return LANGUAGE_NAMES.en;
  }

  return LANGUAGE_NAMES[language as Language] || LANGUAGE_NAMES.en;
}

export function t(
  language: string | undefined,
  key: MessageKey,
  params?: Record<string, string>,
): string {
  const safeLanguage = (language as Language) || 'en';
  const dictionary = messages[safeLanguage] || messages.en;
  return dictionary[key](params);
}
