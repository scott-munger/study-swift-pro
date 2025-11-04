// Réponses pré-configurées du chatbot en français et créole

interface Response {
  keywords: string[];
  response: {
    fr: string;
    creole?: string;
  };
}

const responses: Response[] = [
  {
    keywords: ['bonjour', 'salut', 'hello', 'hi', 'bonjou', 'alò'],
    response: {
      fr: 'Bonjour ! 👋 Je suis l\'assistant TYALA. Comment puis-je vous aider aujourd\'hui ?',
      creole: 'Bonjou ! 👋 Mwen se asistè TYALA. Kouman mwen ka ede ou jodi a ?'
    }
  },
  {
    keywords: ['inscription', 's\'inscrire', 'créer un compte', 'nouveau compte', 'enregistrer', 'signup', 'register'],
    response: {
      fr: 'Pour vous inscrire :\n1. Cliquez sur "S\'inscrire" ou "Inscription"\n2. Remplissez le formulaire avec vos informations\n3. Vérifiez votre email (un lien sera envoyé)\n4. Une fois l\'email vérifié, vous pourrez vous connecter\n\nBesoin d\'aide pour une étape précise ?',
      creole: 'Pou ou enskri :\n1. Klike sou "Enskri" oswa "Inscription"\n2. Ranpli fòmilè a ak enfòmasyon ou\n3. Verifye imèl ou (yon lyen ap vini)\n4. Yon fwa imèl la verifye, ou ka konekte\n\nBeswen èd pou yon etap espesifik ?'
    }
  },
  {
    keywords: ['connexion', 'se connecter', 'login', 'connecter', 'identifier', 'identifier', 'konekte'],
    response: {
      fr: 'Pour vous connecter :\n1. Allez sur la page de connexion\n2. Entrez votre email et mot de passe\n3. Cliquez sur "Se connecter"\n\nSi vous avez oublié votre mot de passe, cliquez sur "Mot de passe oublié".',
      creole: 'Pou ou konekte :\n1. Ale sou paj koneksyon an\n2. Antre imèl ak modpas ou\n3. Klike sou "Konekte"\n\nSi ou bliye modpas ou, klike sou "Modpas oublié".'
    }
  },
  {
    keywords: ['mot de passe', 'password', 'mdp', 'oublié', 'reset', 'réinitialiser', 'modpas', 'oubliye'],
    response: {
      fr: 'Pour réinitialiser votre mot de passe :\n1. Allez sur la page de connexion\n2. Cliquez sur "Mot de passe oublié"\n3. Entrez votre email\n4. Vous recevrez un email avec un lien de réinitialisation\n5. Cliquez sur le lien et définissez un nouveau mot de passe\n\nLe lien expire après 1 heure.',
      creole: 'Pou reinisyalize modpas ou :\n1. Ale sou paj koneksyon an\n2. Klike sou "Modpas oublié"\n3. Antre imèl ou\n4. Ou ap resevwa yon imèl ak yon lyen reinisyalizasyon\n5. Klike sou lyen an epi defini yon nouvo modpas\n\nLyen an ekspire apre 1 èdtan.'
    }
  },
  {
    keywords: ['vérifier', 'vérification', 'email', 'imèl', 'verifye', 'verify'],
    response: {
      fr: 'Vérification de l\'email :\n1. Après l\'inscription, un email est envoyé\n2. Vérifiez votre boîte mail (et les spams)\n3. Cliquez sur le lien dans l\'email\n4. Si vous n\'avez pas reçu l\'email, allez sur /verify-email pour en demander un nouveau\n\nLe lien expire après 24 heures.',
      creole: 'Verifikasyon imèl la :\n1. Apre enskripsyon, yon imèl ap voye\n2. Tcheke bwat imèl ou (ak spam yo)\n3. Klike sou lyen nan imèl la\n4. Si ou pa resevwa imèl la, ale sou /verify-email pou mande yon nouvo\n\nLyen an ekspire apre 24 èdtan.'
    }
  },
  {
    keywords: ['fonctionnalités', 'fonctions', 'que faire', 'comment utiliser', 'fonksyon', 'kijan pou itilize'],
    response: {
      fr: 'TYALA offre plusieurs fonctionnalités :\n\n📚 Flashcards : Créez et étudiez des cartes mémoire\n👥 Groupes d\'étude : Rejoignez ou créez des groupes\n💬 Forum : Posez des questions et partagez\n📝 Tests de connaissances : Testez vos compétences\n👨‍🏫 Tutorat : Trouvez des tuteurs ou devenez tuteur\n\nQuelle fonctionnalité vous intéresse ?',
      creole: 'TYALA ofri plizyè fonksyon :\n\n📚 Flashcards : Kreye epi etidye kat memwa\n👥 Gwoup etid : Ansanm oswa kreye gwoup\n💬 Fòm : Poze kesyon epi pataje\n📝 Tès konesans : Teste konesans ou\n👨‍🏫 Titorat : Jwenn titor oswa vin titor\n\nKi fonksyon ki enterese ou ?'
    }
  },
  {
    keywords: ['flashcard', 'flashcards', 'cartes', 'étude', 'etudye'],
    response: {
      fr: 'Pour utiliser les flashcards :\n1. Allez dans "Flashcards" ou "Mes cartes"\n2. Choisissez une matière\n3. Créez vos propres cartes ou étudiez celles existantes\n4. Répondez aux questions et voyez vos résultats\n\nLes flashcards aident à mémoriser efficacement !',
      creole: 'Pou itilize flashcards yo :\n1. Ale nan "Flashcards" oswa "Kat mwen yo"\n2. Chwazi yon matyè\n3. Kreye kat ou yo oswa etidye sa ki egziste deja\n4. Reponn kesyon yo epi wè rezilta ou\n\nFlashcards yo ede memore efektivman !'
    }
  },
  {
    keywords: ['groupe', 'groupes', 'study group', 'gwoup'],
    response: {
      fr: 'Les groupes d\'étude :\n1. Allez dans "Groupes d\'étude"\n2. Recherchez un groupe ou créez-en un\n3. Rejoignez un groupe qui correspond à votre matière\n4. Participez aux discussions et partagez des ressources\n\nC\'est idéal pour étudier ensemble !',
      creole: 'Gwoup etid yo :\n1. Ale nan "Gwoup etid"\n2. Chèche yon gwoup oswa kreye youn\n3. Ansanm yon gwoup ki matche ak matyè ou\n4. Patisipe nan diskisyon yo epi pataje resous\n\nLi ideyal pou etidye ansanm !'
    }
  },
  {
    keywords: ['forum', 'discussion', 'question', 'kesyon'],
    response: {
      fr: 'Le forum :\n1. Allez dans "Forum"\n2. Parcourez les sujets ou créez un nouveau post\n3. Posez vos questions ou répondez à celles des autres\n4. Partagez vos connaissances et aidez les autres étudiants\n\nN\'hésitez pas à participer !',
      creole: 'Fòm nan :\n1. Ale nan "Fòm"\n2. Parfè sijè yo oswa kreye yon nouvo pòs\n3. Poze kesyon ou oswa reponn sa yo nan lòt moun\n4. Pataje konesans ou epi ede lòt elèv yo\n\nPa ezite patisipe !'
    }
  },
  {
    keywords: ['tuteur', 'tutorat', 'tutor', 'tutoring', 'titor'],
    response: {
      fr: 'Le tutorat :\n1. Allez dans "Tuteurs" pour trouver un tuteur\n2. Filtrez par matière, disponibilité, ou prix\n3. Contactez un tuteur ou réservez une session\n4. Vous pouvez aussi devenir tuteur depuis votre profil\n\nBesoin d\'aide dans une matière ?',
      creole: 'Titorat la :\n1. Ale nan "Titor" pou jwenn yon titor\n2. Filtre pa matyè, disponibilite, oswa pri\n3. Kontakte yon titor oswa rezève yon sesyon\n4. Ou ka tou vin titor depi pwofil ou\n\nBeswen èd nan yon matyè ?'
    }
  },
  {
    keywords: ['problème', 'bug', 'erreur', 'ne marche pas', 'pa fonksyone', 'pwoblèm'],
    response: {
      fr: 'Si vous rencontrez un problème :\n1. Essayez de rafraîchir la page (F5)\n2. Videz le cache de votre navigateur\n3. Vérifiez votre connexion internet\n4. Si le problème persiste, contactez le support : mail@tyala.online\n\nJe peux vous aider à contacter le support si besoin.',
      creole: 'Si ou rankontre yon pwoblèm :\n1. Eseye rafrechi paj la (F5)\n2. Vide cache navigatè ou a\n3. Tcheke koneksyon entènèt ou\n4. Si pwoblèm la kontinye, kontakte sipò : mail@tyala.online\n\nMwen ka ede ou kontakte sipò si bezwen.'
    }
  },
  {
    keywords: ['aide', 'help', 'support', 'assistance', 'ed', 'sipò'],
    response: {
      fr: 'Je peux vous aider avec :\n• L\'inscription et la connexion\n• La réinitialisation de mot de passe\n• Les fonctionnalités de la plateforme\n• Les problèmes techniques\n\nPour un contact direct, vous pouvez envoyer un email à mail@tyala.online\n\nQue souhaitez-vous savoir ?',
      creole: 'Mwen ka ede ou ak :\n• Enskripsyon ak koneksyon\n• Reinisyalizasyon modpas\n• Fonksyon platfòm nan\n• Pwoblèm teknik\n\nPou yon kontak dirèk, ou ka voye imèl bay mail@tyala.online\n\nKi sa ou vle konnen ?'
    }
  },
  {
    keywords: ['contact', 'email', 'mail', 'support', 'contacter', 'kontakte'],
    response: {
      fr: 'Vous pouvez contacter notre équipe support :\n📧 Email : mail@tyala.online\n\nOu utilisez le formulaire ci-dessous pour nous envoyer un message directement depuis ici.',
      creole: 'Ou ka kontakte ekip sipò nou :\n📧 Imèl : mail@tyala.online\n\nOswa itilize fòmilè a pi ba pou voye nou yon mesaj dirèkteman depi isit la.'
    }
  },
  {
    keywords: ['chapitre', 'chapitres', 'chaptè', 'matière', 'matières', 'sujet', 'sujets', 'matyè', 'sijè'],
    response: {
      fr: 'Je peux vous aider à trouver des informations sur les chapitres et matières !\n\nEssayez de me demander :\n• "Quelles matières sont disponibles ?"\n• "Quels sont les chapitres de [nom de la matière] ?"\n• "Recherche [nom d\'un chapitre ou matière]"\n\nQue souhaitez-vous savoir ?',
      creole: 'Mwen ka ede ou jwenn enfòmasyon sou chapit yo ak matyè yo !\n\nEseye mande mwen :\n• "Ki matyè ki disponib ?"\n• "Ki chapit yo nan [non matyè a] ?"\n• "Chèche [non yon chapit oswa matyè]"\n\nKi sa ou vle konnen ?'
    }
  },
  {
    keywords: ['liste', 'matières', 'disponibles', 'quelles matières', 'ki matyè', 'tout matyè'],
    response: {
      fr: 'Je peux vous lister toutes les matières disponibles ! Tapez "liste des matières" ou utilisez le bouton ci-dessous pour voir toutes les matières.',
      creole: 'Mwen ka liste tout matyè ki disponib pou ou ! Tape "lis matyè" oswa itilize bouton an pi ba pou wè tout matyè yo.'
    }
  },
  {
    keywords: ['test', 'tests', 'examen', 'examens', 'quiz', 'tès', 'egzamen'],
    response: {
      fr: 'Les tests de connaissances :\n1. Allez dans "Tests de connaissances"\n2. Choisissez une matière\n3. Sélectionnez un test\n4. Répondez aux questions dans le temps imparti\n5. Voyez vos résultats et votre score\n\nLes tests vous aident à évaluer votre niveau !',
      creole: 'Tès konesans yo :\n1. Ale nan "Tès konesans"\n2. Chwazi yon matyè\n3. Chwazi yon tès\n4. Reponn kesyon yo nan tan ki disponib\n5. Wè rezilta ou ak nòt ou\n\nTès yo ede ou evalye nivo ou !'
    }
  },
  {
    keywords: ['profil', 'profil', 'compte', 'paramètres', 'pwofil', 'kont'],
    response: {
      fr: 'Pour accéder à votre profil :\n1. Cliquez sur votre photo de profil en haut à droite\n2. Allez dans "Profil" ou "Paramètres"\n3. Vous pouvez modifier vos informations, photo, mot de passe\n4. Pour les tuteurs : gérez votre profil tuteur\n\nQu\'est-ce que vous souhaitez modifier ?',
      creole: 'Pou aksede pwofil ou :\n1. Klike sou foto pwofil ou anlè a dwat\n2. Ale nan "Pwofil" oswa "Paramèt"\n3. Ou ka modifye enfòmasyon ou, foto, modpas\n4. Pou titor : jere pwofil titor ou\n\nKi sa ou vle modifye ?'
    }
  },
  {
    keywords: ['message', 'messages', 'messagerie', 'conversation', 'chat', 'mesaj', 'konvèsasyon'],
    response: {
      fr: 'La messagerie TYALA :\n1. Allez dans "Messages" depuis le menu\n2. Sélectionnez une conversation ou créez-en une nouvelle\n3. Vous pouvez envoyer des messages texte, voix, images et fichiers\n4. Les messages avec les tuteurs apparaissent automatiquement\n5. Utilisez les messages pour discuter avec vos tuteurs\n\nBesoin d\'aide pour une fonctionnalité spécifique ?',
      creole: 'Mesaje TYALA a :\n1. Ale nan "Mesaj" depi meni an\n2. Chwazi yon konvèsasyon oswa kreye yon nouvo\n3. Ou ka voye mesaj tèks, vwa, foto ak fichye\n4. Mesaj ak titor yo parèt otomatikman\n5. Itilize mesaj yo pou diskite ak titor ou yo\n\nBeswen èd pou yon fonksyon espesifik ?'
    }
  },
  {
    keywords: ['devenir tuteur', 'tuteur', 'become tutor', 'vin titor', 'kreye pwofil titor'],
    response: {
      fr: 'Pour devenir tuteur :\n1. Allez dans "Devenir tuteur" ou dans votre profil\n2. Remplissez le formulaire avec vos spécialités\n3. Indiquez vos matières et votre tarif horaire\n4. Ajoutez une description de vos compétences\n5. Une fois validé, vous pourrez recevoir des demandes de sessions\n\nLes étudiants pourront vous trouver et réserver des sessions !',
      creole: 'Pou vin titor :\n1. Ale nan "Vin titor" oswa nan pwofil ou\n2. Ranpli fòmilè a ak espesyalite ou\n3. Endike matyè ou ak tarif èdtan ou\n4. Ajoute yon deskripsyon sou konpetans ou\n5. Yon fwa valide, ou ka resevwa demann sesyon\n\nElèv yo ka jwenn ou epi rezève sesyon !'
    }
  },
  {
    keywords: ['dashboard', 'tableau de bord', 'accueil', 'tablo', 'akèy'],
    response: {
      fr: 'Votre dashboard vous permet de :\n• Voir vos statistiques (flashcards étudiées, tests passés)\n• Accéder rapidement aux fonctionnalités principales\n• Suivre votre progression\n• Voir vos activités récentes\n\nNaviguez facilement vers :\n• Flashcards\n• Tests de connaissances\n• Forum\n• Tuteurs\n• Messages\n\nQue souhaitez-vous faire ?',
      creole: 'Dashboard ou a pèmèt ou :\n• Wè estatistik ou (flashcards etidye, tès pase)\n• Aksede rapidman fonksyon prensipal yo\n• Swiv pwogrè ou\n• Wè aktivite resan ou\n\nNavige fasilman nan :\n• Flashcards\n• Tès konesans\n• Fòm\n• Titor\n• Mesaj\n\nKi sa ou vle fè ?'
    }
  },
  {
    keywords: ['créer flashcard', 'créer carte', 'nouvelle flashcard', 'kreye flashcard', 'nouvo kat'],
    response: {
      fr: 'Pour créer une flashcard :\n1. Allez dans "Flashcards"\n2. Choisissez une matière et un chapitre\n3. Cliquez sur "Créer une flashcard"\n4. Remplissez la question et la réponse\n5. Choisissez la difficulté (facile, moyen, difficile)\n6. Sauvegardez votre carte\n\nVous pouvez créer des cartes personnalisées pour réviser efficacement !',
      creole: 'Pou kreye yon flashcard :\n1. Ale nan "Flashcards"\n2. Chwazi yon matyè ak yon chapit\n3. Klike sou "Kreye yon flashcard"\n4. Ranpli kesyon an ak repons la\n5. Chwazi difikilte a (fasil, mwayen, difisil)\n6. Sove kat ou a\n\nOu ka kreye kat pèsonalize pou revize efektivman !'
    }
  },
  {
    keywords: ['résultat', 'résultats', 'score', 'note', 'rezilta', 'nòt'],
    response: {
      fr: 'Pour voir vos résultats :\n• Tests : Allez dans "Tests de connaissances" → "Mes résultats"\n• Flashcards : Consultez vos statistiques dans la section Flashcards\n• Progression : Suivez votre évolution dans votre dashboard\n\nLes résultats vous aident à identifier vos forces et vos points à améliorer !',
      creole: 'Pou wè rezilta ou :\n• Tès : Ale nan "Tès konesans" → "Rezilta mwen"\n• Flashcards : Konsilte estatistik ou nan seksyon Flashcards\n• Pwogrè : Swiv evolisyon ou nan dashboard ou\n\nRezilta yo ede ou idantifye fòs ou ak pwen pou amelyore !'
    }
  },
  {
    keywords: ['progression', 'suivre', 'statistiques', 'stats', 'pwogrè', 'estatistik'],
    response: {
      fr: 'Suivez votre progression :\n• Dashboard : Consultez vos statistiques globales\n• Flashcards : Voyez combien de cartes vous avez étudiées\n• Tests : Consultez vos scores et votre évolution\n• Profil : Retrouvez un résumé de vos activités\n\nLa progression vous motive à continuer vos efforts !',
      creole: 'Swiv pwogrè ou :\n• Dashboard : Konsilte estatistik global ou\n• Flashcards : Wè konbyen kat ou etidye\n• Tès : Konsilte nòt ou ak evolisyon ou\n• Pwofil : Jwenn yon rezime aktivite ou\n\nPwogrè a ankouraje ou kontinye efò ou !'
    }
  },
  {
    keywords: ['créer groupe', 'nouveau groupe', 'groupe d\'étude', 'kreye gwoup', 'nouvo gwoup'],
    response: {
      fr: 'Pour créer un groupe d\'étude :\n1. Allez dans "Groupes d\'étude"\n2. Cliquez sur "Créer un groupe"\n3. Donnez un nom et une description à votre groupe\n4. Choisissez une matière et votre classe\n5. Décidez si le groupe est public ou privé\n6. Invitez vos camarades à rejoindre le groupe\n\nLes groupes permettent d\'étudier ensemble et de partager des ressources !',
      creole: 'Pou kreye yon gwoup etid :\n1. Ale nan "Gwoup etid"\n2. Klike sou "Kreye yon gwoup"\n3. Bay yon non ak deskripsyon gwoup ou a\n4. Chwazi yon matyè ak klas ou\n5. Deside si gwoup la piblik oswa prive\n6. Envite kamerad ou yo pou ansanm gwoup la\n\nGwoup yo pèmèt etidye ansanm epi pataje resous !'
    }
  },
  {
    keywords: ['rejoindre groupe', 'adhérer', 'groupe', 'ansanm gwoup', 'jwenn gwoup'],
    response: {
      fr: 'Pour rejoindre un groupe :\n1. Allez dans "Groupes d\'étude"\n2. Parcourez les groupes disponibles\n3. Filtrez par matière, classe ou section\n4. Cliquez sur "Rejoindre" pour un groupe public\n5. Pour un groupe privé, attendez une invitation\n6. Une fois membre, vous pouvez participer aux discussions\n\nLes groupes sont parfaits pour étudier en équipe !',
      creole: 'Pou ansanm yon gwoup :\n1. Ale nan "Gwoup etid"\n2. Parfè gwoup ki disponib yo\n3. Filtre pa matyè, klas oswa seksyon\n4. Klike sou "Ansanm" pou yon gwoup piblik\n5. Pou yon gwoup prive, tann yon envitasyon\n6. Yon fwa manm, ou ka patisipe nan diskisyon yo\n\nGwoup yo pafè pou etidye nan ekip !'
    }
  },
  {
    keywords: ['réserver', 'session', 'tuteur', 'reserver', 'sesyon'],
    response: {
      fr: 'Pour réserver une session avec un tuteur :\n1. Allez dans "Tuteurs" et recherchez un tuteur\n2. Consultez son profil, ses spécialités et ses tarifs\n3. Cliquez sur "Réserver une session"\n4. Choisissez une date et une heure\n5. Indiquez le sujet à aborder\n6. Confirmez votre réservation\n\nVous pourrez ensuite échanger avec le tuteur via la messagerie !',
      creole: 'Pou rezève yon sesyon ak yon titor :\n1. Ale nan "Titor" epi chèche yon titor\n2. Konsilte pwofil li, espesyalite li ak tarif li\n3. Klike sou "Rezève yon sesyon"\n4. Chwazi yon dat ak yon lè\n5. Endike sijè a abòde\n6. Konfime rezèvasyon ou\n\nOu ka echanj ak titor la atravè mesaje !'
    }
  },
  {
    keywords: ['notification', 'notifications', 'alertes', 'notifikasyon', 'ale'],
    response: {
      fr: 'Les notifications vous informent sur :\n• Nouveaux messages dans vos conversations\n• Réponses à vos posts dans le forum\n• Invitations à rejoindre des groupes\n• Résultats de vos tests\n• Rappels de sessions avec les tuteurs\n\nConsultez vos notifications dans le menu ou dans votre dashboard !',
      creole: 'Notifikasyon yo enfòme ou sou :\n• Nouvo mesaj nan konvèsasyon ou\n• Repons nan pòs ou yo nan fòm nan\n• Envitasyon pou ansanm gwoup\n• Rezilta tès ou\n• Rapèl sesyon ak titor yo\n\nKonsilte notifikasyon ou nan meni an oswa nan dashboard ou !'
    }
  },
  {
    keywords: ['rôle', 'étudiant', 'tuteur', 'admin', 'wòl', 'elèv', 'titor'],
    response: {
      fr: 'TYALA a 3 types de rôles :\n\n👨‍🎓 Étudiant :\n• Accès aux flashcards, tests, forum\n• Peut réserver des sessions avec les tuteurs\n• Peut rejoindre des groupes d\'étude\n\n👨‍🏫 Tuteur :\n• Toutes les fonctionnalités étudiant\n• Peut donner des sessions de tutorat\n• Peut créer des groupes de tutorat\n\n👨‍💼 Admin :\n• Gestion complète de la plateforme\n• Modération du contenu\n• Administration des utilisateurs\n\nQuel rôle souhaitez-vous connaître mieux ?',
      creole: 'TYALA gen 3 kalite wòl :\n\n👨‍🎓 Elèv :\n• Aksè nan flashcards, tès, fòm\n• Ka rezève sesyon ak titor yo\n• Ka ansanm gwoup etid\n\n👨‍🏫 Titor :\n• Tout fonksyon elèv yo\n• Ka bay sesyon titorat\n• Ka kreye gwoup titorat\n\n👨‍💼 Admin :\n• Jestion konplè platfòm nan\n• Modèrasyon kontni\n• Administrasyon itilizatè\n\nKi wòl ou vle konnen pi byen ?'
    }
  },
  {
    keywords: ['mode', 'modes', 'flashcard mode', 'examen', 'démo', 'mòd'],
    response: {
      fr: 'Modes d\'étude disponibles :\n\n📚 Mode Flashcard :\n• Étudiez carte par carte\n• Répondez et voyez la réponse\n• Parfait pour la mémorisation\n\n📝 Mode Examen :\n• Testez-vous avec un temps limité\n• Voyez vos résultats à la fin\n• Idéal pour évaluer vos connaissances\n\n🎯 Mode Démo :\n• Explorez les flashcards sans pression\n• Apprenez à votre rythme\n• Bon pour découvrir le contenu\n\nQuel mode souhaitez-vous essayer ?',
      creole: 'Mòd etid ki disponib :\n\n📚 Mòd Flashcard :\n• Etidye kat pa kat\n• Reponn epi wè repons la\n• Pafè pou memorizasyon\n\n📝 Mòd Egzamen :\n• Teste ou ak yon tan limite\n• Wè rezilta ou nan fen an\n• Ideyal pou evalye konesans ou\n\n🎯 Mòd Demo :\n• Eksplore flashcards yo san presyon\n• Aprann nan ritm ou\n• Bon pou dekouvri kontni a\n\nKi mòd ou vle eseye ?'
    }
  },
  {
    keywords: ['étudier', 'réviser', 'apprendre', 'etudye', 'revize', 'aprann'],
    response: {
      fr: 'Conseils pour étudier efficacement sur TYALA :\n\n1. Créez vos propres flashcards personnalisées\n2. Utilisez les groupes d\'étude pour collaborer\n3. Passez régulièrement des tests pour évaluer vos connaissances\n4. Participez au forum pour poser vos questions\n5. Réservez des sessions avec des tuteurs si besoin\n6. Suivez votre progression dans le dashboard\n\nQuelle méthode vous intéresse le plus ?',
      creole: 'Konsèy pou etidye efektivman sou TYALA :\n\n1. Kreye flashcards pèsonalize ou yo\n2. Itilize gwoup etid yo pou kolabore\n3. Pase regilyèman tès pou evalye konesans ou\n4. Patisipe nan fòm nan pou poze kesyon ou\n5. Rezève sesyon ak titor si bezwen\n6. Swiv pwogrè ou nan dashboard la\n\nKi metòd ki enterese ou pi plis ?'
    }
  },
  {
    keywords: ['partager', 'ressource', 'fichier', 'pataje', 'resous', 'fichye'],
    response: {
      fr: 'Vous pouvez partager des ressources de plusieurs façons :\n\n📁 Dans les groupes d\'étude :\n• Envoyez des fichiers, images ou messages vocaux\n• Partagez des liens utiles dans les discussions\n\n📝 Dans le forum :\n• Ajoutez des images à vos posts\n• Partagez vos connaissances avec la communauté\n\n💬 Dans les messages :\n• Envoyez des fichiers aux tuteurs\n• Partagez vos documents de révision\n\nComment souhaitez-vous partager ?',
      creole: 'Ou ka pataje resous nan plizyè fason :\n\n📁 Nan gwoup etid yo :\n• Voye fichye, foto oswa mesaj vwa\n• Pataje lyen itil nan diskisyon yo\n\n📝 Nan fòm nan :\n• Ajoute foto nan pòs ou yo\n• Pataje konesans ou ak kominote a\n\n💬 Nan mesaj yo :\n• Voye fichye bay titor yo\n• Pataje dokiman revizyon ou\n\nKijan ou vle pataje ?'
    }
  },
  {
    keywords: ['message vocal', 'voix', 'audio', 'enregistrer', 'mesaj vwa', 'anrejistre'],
    response: {
      fr: 'Pour envoyer un message vocal :\n1. Dans un groupe ou une conversation, trouvez le bouton microphone\n2. Cliquez et maintenez pour enregistrer\n3. Relâchez pour envoyer le message\n4. Vous pouvez également écouter les messages vocaux reçus\n\nLes messages vocaux sont parfaits pour expliquer des concepts !',
      creole: 'Pou voye yon mesaj vwa :\n1. Nan yon gwoup oswa konvèsasyon, jwenn bouton mikwofòn nan\n2. Klike epi kenbe pou anrejistre\n3. Lage pou voye mesaj la\n4. Ou ka tou tande mesaj vwa resevwa yo\n\nMesaj vwa yo pafè pou eksplike konsèp !'
    }
  },
  {
    keywords: ['créer post', 'poser question', 'nouveau post', 'kreye pòs', 'poze kesyon'],
    response: {
      fr: 'Pour créer un post dans le forum :\n1. Allez dans "Forum"\n2. Cliquez sur "Nouveau post" ou "Poser une question"\n3. Rédigez votre question ou votre sujet\n4. Ajoutez des images si nécessaire\n5. Choisissez la catégorie appropriée\n6. Publiez votre post\n\nLa communauté pourra vous répondre et vous aider !',
      creole: 'Pou kreye yon pòs nan fòm nan :\n1. Ale nan "Fòm"\n2. Klike sou "Nouvo pòs" oswa "Poze yon kesyon"\n3. Redije kesyon ou oswa sijè ou\n4. Ajoute foto si bezwen\n5. Chwazi kategori apwopriye a\n6. Pibliye pòs ou\n\nKominote a ka reponn ou epi ede ou !'
    }
  },
  {
    keywords: ['répondre', 'commentaire', 'reply', 'reponn', 'kòmantè'],
    response: {
      fr: 'Pour répondre à un post :\n1. Dans le forum, ouvrez le post qui vous intéresse\n2. Lisez les autres réponses\n3. Cliquez sur "Répondre" ou écrivez dans la zone de commentaire\n4. Partagez vos connaissances et votre expérience\n5. Vous pouvez aussi répondre à une réponse spécifique\n\nContribuez à la communauté en aidant les autres !',
      creole: 'Pou reponn yon pòs :\n1. Nan fòm nan, louvri pòs ki enterese ou\n2. Li lòt repons yo\n3. Klike sou "Reponn" oswa ekri nan zòn kòmantè a\n4. Pataje konesans ou ak eksperyans ou\n5. Ou ka tou reponn yon repons espesifik\n\nKontribye nan kominote a nan ede lòt moun !'
    }
  },
  {
    keywords: ['trouver tuteur', 'rechercher tuteur', 'tuteur disponible', 'jwenn titor', 'chèche titor'],
    response: {
      fr: 'Pour trouver un tuteur :\n1. Allez dans "Tuteurs"\n2. Utilisez les filtres pour rechercher par :\n   • Matière\n   • Disponibilité\n   • Tarif\n   • Note\n3. Consultez les profils des tuteurs\n4. Lisez les avis et les spécialités\n5. Contactez directement ou réservez une session\n\nTrouvez le tuteur idéal pour vos besoins !',
      creole: 'Pou jwenn yon titor :\n1. Ale nan "Titor"\n2. Itilize filtre yo pou chèche pa :\n   • Matyè\n   • Disponibilite\n   • Tarif\n   • Nòt\n3. Konsilte pwofil titor yo\n4. Li avi yo ak espesyalite yo\n5. Kontakte dirèkteman oswa rezève yon sesyon\n\nJwenn titor ideyal la pou bezwen ou !'
    }
  },
  {
    keywords: ['modifier profil', 'changer photo', 'mettre à jour', 'modifye pwofil', 'chanje foto'],
    response: {
      fr: 'Pour modifier votre profil :\n1. Allez dans votre profil (icône en haut à droite)\n2. Cliquez sur "Modifier" ou "Paramètres"\n3. Vous pouvez changer :\n   • Vos informations personnelles\n   • Votre photo de profil\n   • Votre mot de passe\n   • Vos préférences\n4. Pour les tuteurs : gérez vos spécialités et tarifs\n\nGardez votre profil à jour !',
      creole: 'Pou modifye pwofil ou :\n1. Ale nan pwofil ou (ikon anlè a dwat)\n2. Klike sou "Modifye" oswa "Paramèt"\n3. Ou ka chanje :\n   • Enfòmasyon pèsonèl ou\n   • Foto pwofil ou\n   • Modpas ou\n   • Preferans ou\n4. Pou titor : jere espesyalite ou ak tarif ou\n\nKenbe pwofil ou ajou !'
    }
  },
  {
    keywords: ['contacter tuteur', 'message tuteur', 'discuter', 'kontakte titor', 'mesaj titor'],
    response: {
      fr: 'Pour contacter un tuteur :\n1. Trouvez le tuteur dans la section "Tuteurs"\n2. Consultez son profil\n3. Cliquez sur "Contacter" ou "Envoyer un message"\n4. Une conversation s\'ouvrira dans vos messages\n5. Vous pouvez discuter avant de réserver une session\n6. Les tuteurs peuvent aussi vous contacter directement\n\nLa messagerie facilite la communication !',
      creole: 'Pou kontakte yon titor :\n1. Jwenn titor la nan seksyon "Titor"\n2. Konsilte pwofil li\n3. Klike sou "Kontakte" oswa "Voye yon mesaj"\n4. Yon konvèsasyon ap louvri nan mesaj ou\n5. Ou ka diskite anvan rezève yon sesyon\n6. Titor yo ka tou kontakte ou dirèkteman\n\nMesaje a fasilite kominikasyon !'
    }
  },
  {
    keywords: ['mes groupes', 'groupes', 'mes groupes d\'étude', 'gwoup mwen', 'gwoup etid mwen'],
    response: {
      fr: 'Pour voir vos groupes :\n1. Allez dans "Groupes d\'étude" ou votre dashboard\n2. Vous verrez tous les groupes dont vous êtes membre\n3. Cliquez sur un groupe pour accéder aux discussions\n4. Vous pouvez créer un nouveau groupe ou en rejoindre d\'autres\n5. Les groupes sont organisés par matière et classe\n\nLes groupes permettent d\'étudier ensemble efficacement !',
      creole: 'Pou wè gwoup ou :\n1. Ale nan "Gwoup etid" oswa dashboard ou\n2. Ou ap wè tout gwoup ou memm yo\n3. Klike sou yon gwoup pou aksede diskisyon yo\n4. Ou ka kreye yon nouvo gwoup oswa ansanm lòt yo\n5. Gwoup yo òganize pa matyè ak klas\n\nGwoup yo pèmèt etidye ansanm efektivman !'
    }
  },
  {
    keywords: ['améliorer', 'progresser', 'mieux', 'amelyore', 'pwogrese'],
    response: {
      fr: 'Pour améliorer vos résultats :\n\n📚 Étudiez régulièrement :\n• Utilisez les flashcards quotidiennement\n• Passez des tests régulièrement\n\n👥 Collaborez :\n• Rejoignez des groupes d\'étude\n• Participez au forum\n\n👨‍🏫 Demandez de l\'aide :\n• Réservez des sessions avec des tuteurs\n• Posez des questions dans le forum\n\n📊 Suivez votre progression :\n• Consultez vos statistiques\n• Identifiez vos points faibles\n\nQuelle méthode voulez-vous essayer ?',
      creole: 'Pou amelyore rezilta ou :\n\n📚 Etidye regilyèman :\n• Itilize flashcards yo chak jou\n• Pase tès regilyèman\n\n👥 Kolabore :\n• Ansanm gwoup etid\n• Patisipe nan fòm nan\n\n👨‍🏫 Mande èd :\n• Rezève sesyon ak titor yo\n• Poze kesyon nan fòm nan\n\n📊 Swiv pwogrè ou :\n• Konsilte estatistik ou\n• Idantifye pwen fèb ou\n\nKi metòd ou vle eseye ?'
    }
  },
  {
    keywords: ['difficulté', 'difficile', 'facile', 'niveau', 'difikilte', 'fasil', 'nivo'],
    response: {
      fr: 'Les flashcards ont 3 niveaux de difficulté :\n\n🟢 Facile :\n• Questions simples et directes\n• Parfait pour débuter\n\n🟡 Moyen :\n• Questions modérées\n• Idéal pour la pratique régulière\n\n🔴 Difficile :\n• Questions complexes\n• Pour les apprenants avancés\n\nChoisissez la difficulté qui correspond à votre niveau !',
      creole: 'Flashcards yo gen 3 nivo difikilte :\n\n🟢 Fasil :\n• Kesyon senp ak dirèk\n• Pafè pou kòmanse\n\n🟡 Mwayen :\n• Kesyon modere\n• Ideyal pou pratike regilyèman\n\n🔴 Difisil :\n• Kesyon konplèks\n• Pou aprenan avanse\n\nChwazi difikilte ki matche ak nivo ou !'
    }
  },
  {
    keywords: ['temps', 'durée', 'limite', 'tan', 'dure'],
    response: {
      fr: 'Gestion du temps sur TYALA :\n\n⏱️ Mode Examen :\n• Temps limité pour répondre\n• Vous voyez le temps restant\n• Idéal pour simuler un examen réel\n\n📚 Mode Flashcard :\n• Pas de limite de temps\n• Étudiez à votre rythme\n• Parfait pour apprendre\n\n🎯 Mode Démo :\n• Explorez sans pression\n• Pas de contrainte de temps\n\nChoisissez le mode qui vous convient !',
      creole: 'Jestion tan sou TYALA :\n\n⏱️ Mòd Egzamen :\n• Tan limite pou reponn\n• Ou wè tan ki rete\n• Ideyal pou simile yon egzamen reyèl\n\n📚 Mòd Flashcard :\n• Pa gen limit tan\n• Etidye nan ritm ou\n• Pafè pou aprann\n\n🎯 Mòd Demo :\n• Eksplore san presyon\n• Pa gen kontrent tan\n\nChwazi mòd ki konvini ou !'
    }
  }
];

// Réponse par défaut
const defaultResponse = {
  fr: 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre question ?\n\nVoici ce que je peux vous aider :\n• Inscription et connexion\n• Réinitialisation de mot de passe\n• Fonctionnalités de la plateforme\n• Recherche de matières et chapitres\n• Problèmes techniques\n\nEssayez de me demander :\n• "Quelles matières sont disponibles ?"\n• "Recherche [nom d\'une matière]"\n• "Quels sont les chapitres de [matière] ?"\n\nOu contactez directement mail@tyala.online',
  creole: 'Mwen pa sèten mwen konprann. Èske ou ka refòmile kesyon ou a ?\n\nMen sa mwen ka ede ou :\n• Enskripsyon ak koneksyon\n• Reinisyalizasyon modpas\n• Fonksyon platfòm nan\n• Chèche matyè ak chapit\n• Pwoblèm teknik\n\nEseye mande mwen :\n• "Ki matyè ki disponib ?"\n• "Chèche [non yon matyè]"\n• "Ki chapit yo nan [matyè] ?"\n\nOswa kontakte dirèkteman mail@tyala.online'
};

// Détecter la langue (simple détection basée sur certains mots créoles)
function detectLanguage(text: string): 'fr' | 'creole' {
  const creoleKeywords = ['kijan', 'kisa', 'kote', 'pou', 'mwen', 'ou', 'li', 'nou', 'yo', 'se', 'pa', 'gen', 'tou', 'toujou', 'anpil'];
  const lowerText = text.toLowerCase();
  const creoleCount = creoleKeywords.filter(keyword => lowerText.includes(keyword)).length;
  return creoleCount >= 2 ? 'creole' : 'fr';
}

// Trouver la réponse appropriée
export function findResponse(userInput: string): string {
  const lowerInput = userInput.toLowerCase();
  const language = detectLanguage(userInput);
  
  // Chercher une correspondance par mots-clés
  for (const response of responses) {
    const matches = response.keywords.filter(keyword => 
      lowerInput.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      // Retourner la réponse dans la langue détectée (ou français si pas de version créole)
      if (language === 'creole' && response.response.creole) {
        return response.response.creole;
      }
      return response.response.fr;
    }
  }
  
  // Réponse par défaut dans la langue détectée
  if (language === 'creole') {
    return defaultResponse.creole || defaultResponse.fr;
  }
  return defaultResponse.fr;
}

// Message de bienvenue
export function getGreeting(): string {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour < 12) {
    greeting = 'Bonjour ! 👋';
  } else if (hour < 18) {
    greeting = 'Bon après-midi ! 👋';
  } else {
    greeting = 'Bonsoir ! 👋';
  }
  
  return `${greeting} Je suis l'assistant TYALA. Posez-moi vos questions ou utilisez les boutons ci-dessous pour des réponses rapides.\n\nJe comprends le français et le créole ! 🌍`;
}

export { responses };

