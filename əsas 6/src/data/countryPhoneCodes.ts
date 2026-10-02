export interface CountryPhone {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  digits: number;
  mask: string;
  example: string;
  altNames?: string[];
}

export const COUNTRY_PHONE_LIST: CountryPhone[] = [
  // Primary & Regionally Popular
  { code: 'AZ', name: 'Azərbaycan', dialCode: '+994', flag: '🇦🇿', digits: 9, mask: '(##) ###-##-##', example: '50 123 45 67', altNames: ['Azerbaijan'] },
  { code: 'TR', name: 'Türkiyə', dialCode: '+90', flag: '🇹🇷', digits: 10, mask: '(###) ###-##-##', example: '532 123 45 67', altNames: ['Turkey', 'Turkiye'] },
  { code: 'RU', name: 'Rusiya', dialCode: '+7', flag: '🇷🇺', digits: 10, mask: '(###) ###-##-##', example: '912 345 67 89', altNames: ['Russia', 'Россия'] },
  { code: 'GE', name: 'Gürcüstan', dialCode: '+995', flag: '🇬🇪', digits: 9, mask: '(###) ##-##-##', example: '599 12 34 56', altNames: ['Georgia', 'Gruziya'] },
  { code: 'KZ', name: 'Qazaxıstan', dialCode: '+7', flag: '🇰🇿', digits: 10, mask: '(###) ###-##-##', example: '701 234 56 78', altNames: ['Kazakhstan', 'Казахстан'] },
  { code: 'UZ', name: 'Özbəkistan', dialCode: '+998', flag: '🇺🇿', digits: 9, mask: '(##) ###-##-##', example: '90 123 45 67', altNames: ['Uzbekistan', 'Узбекистан'] },
  { code: 'UA', name: 'Ukrayna', dialCode: '+380', flag: '🇺🇦', digits: 9, mask: '(##) ###-##-##', example: '50 123 45 67', altNames: ['Ukraine', 'Украина'] },
  { code: 'DE', name: 'Almaniya', dialCode: '+49', flag: '🇩🇪', digits: 10, mask: '(###) ###-####', example: '151 234 5678', altNames: ['Germany', 'Deutschland'] },
  { code: 'GB', name: 'Böyük Britaniya (UK)', dialCode: '+44', flag: '🇬🇧', digits: 10, mask: '(####) ######', example: '7911 123456', altNames: ['United Kingdom', 'England', 'İngiltərə', 'UK'] },
  { code: 'US', name: 'ABŞ (USA)', dialCode: '+1', flag: '🇺🇸', digits: 10, mask: '(###) ###-####', example: '555 123 4567', altNames: ['United States', 'America', 'USA'] },
  { code: 'CA', name: 'Kanada', dialCode: '+1', flag: '🇨🇦', digits: 10, mask: '(###) ###-####', example: '555 123 4567', altNames: ['Canada'] },
  { code: 'AE', name: 'BƏƏ (Dubay)', dialCode: '+971', flag: '🇦🇪', digits: 9, mask: '(##) ###-####', example: '50 123 4567', altNames: ['UAE', 'Dubai', 'United Arab Emirates'] },
  { code: 'SA', name: 'Səudiyyə Ərəbistanı', dialCode: '+966', flag: '🇸🇦', digits: 9, mask: '(##) ###-####', example: '50 123 4567', altNames: ['Saudi Arabia'] },

  // A
  { code: 'AF', name: 'Əfqanıstan', dialCode: '+93', flag: '🇦🇫', digits: 9, mask: '(##) ###-####', example: '70 123 4567', altNames: ['Afghanistan'] },
  { code: 'AL', name: 'Albaniya', dialCode: '+355', flag: '🇦🇱', digits: 9, mask: '(###) ###-###', example: '691 234 567', altNames: ['Albania'] },
  { code: 'DZ', name: 'Əlcəzair', dialCode: '+213', flag: '🇩🇿', digits: 9, mask: '(###) ##-##-##', example: '551 23 45 67', altNames: ['Algeria'] },
  { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩', digits: 6, mask: '###-###', example: '312 345', altNames: ['Andorra'] },
  { code: 'AO', name: 'Anqola', dialCode: '+244', flag: '🇦🇴', digits: 9, mask: '(###) ###-###', example: '923 123 456', altNames: ['Angola'] },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', digits: 10, mask: '(###) ###-####', example: '911 123 4567', altNames: ['Argentina'] },
  { code: 'AM', name: 'Ermənistan', dialCode: '+374', flag: '🇦🇲', digits: 8, mask: '(##) ###-###', example: '77 123 456', altNames: ['Armenia'] },
  { code: 'AU', name: 'Avstraliya', dialCode: '+61', flag: '🇦🇺', digits: 9, mask: '(###) ###-###', example: '412 345 678', altNames: ['Australia'] },
  { code: 'AT', name: 'Avstriya', dialCode: '+43', flag: '🇦🇹', digits: 10, mask: '(###) ###-####', example: '664 123 4567', altNames: ['Austria'] },

  // B
  { code: 'BH', name: 'Bəhreyn', dialCode: '+973', flag: '🇧🇭', digits: 8, mask: '####-####', example: '3600 1234', altNames: ['Bahrain'] },
  { code: 'BD', name: 'Banqladeş', dialCode: '+880', flag: '🇧🇩', digits: 10, mask: '(####) ######', example: '1812 345678', altNames: ['Bangladesh'] },
  { code: 'BY', name: 'Belarus', dialCode: '+375', flag: '🇧🇾', digits: 9, mask: '(##) ###-##-##', example: '29 123 45 67', altNames: ['Belarus', 'Belorusiya'] },
  { code: 'BE', name: 'Belçika', dialCode: '+32', flag: '🇧🇪', digits: 9, mask: '(###) ##-##-##', example: '470 12 34 56', altNames: ['Belgium'] },
  { code: 'BZ', name: 'Beliz', dialCode: '+501', flag: '🇧🇿', digits: 7, mask: '###-####', example: '612 3456', altNames: ['Belize'] },
  { code: 'BJ', name: 'Benin', dialCode: '+229', flag: '🇧🇯', digits: 8, mask: '##-##-##-##', example: '97 12 34 56', altNames: ['Benin'] },
  { code: 'BT', name: 'Butan', dialCode: '+975', flag: '🇧🇹', digits: 8, mask: '##-###-###', example: '17 123 456', altNames: ['Bhutan'] },
  { code: 'BO', name: 'Boliviya', dialCode: '+591', flag: '🇧🇴', digits: 8, mask: '####-####', example: '7123 4567', altNames: ['Bolivia'] },
  { code: 'BA', name: 'Bosniya və Herseqovina', dialCode: '+387', flag: '🇧🇦', digits: 8, mask: '(##) ###-###', example: '61 123 456', altNames: ['Bosnia and Herzegovina'] },
  { code: 'BW', name: 'Botsvana', dialCode: '+267', flag: '🇧🇼', digits: 8, mask: '##-###-###', example: '71 123 456', altNames: ['Botswana'] },
  { code: 'BR', name: 'Braziliya', dialCode: '+55', flag: '🇧🇷', digits: 11, mask: '(##) #####-####', example: '11 91234 5678', altNames: ['Brazil', 'Brasil'] },
  { code: 'BN', name: 'Bruney', dialCode: '+673', flag: '🇧🇳', digits: 7, mask: '###-####', example: '712 3456', altNames: ['Brunei'] },
  { code: 'BG', name: 'Bolqarıstan', dialCode: '+359', flag: '🇧🇬', digits: 9, mask: '(###) ###-###', example: '871 234 567', altNames: ['Bulgaria'] },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫', digits: 8, mask: '##-##-##-##', example: '70 12 34 56', altNames: ['Burkina Faso'] },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮', digits: 8, mask: '##-##-##-##', example: '79 12 34 56', altNames: ['Burundi'] },

  // C
  { code: 'KH', name: 'Kamboca', dialCode: '+855', flag: '🇰🇭', digits: 9, mask: '(##) ###-####', example: '12 345 678', altNames: ['Cambodia'] },
  { code: 'CM', name: 'Kamerun', dialCode: '+237', flag: '🇨🇲', digits: 9, mask: '(###) ##-##-##', example: '671 23 45 67', altNames: ['Cameroon'] },
  { code: 'CV', name: 'Kabo Verde', dialCode: '+238', flag: '🇨🇻', digits: 7, mask: '###-####', example: '991 2345', altNames: ['Cape Verde'] },
  { code: 'CL', name: 'Çili', dialCode: '+56', flag: '🇨🇱', digits: 9, mask: '(#) ####-####', example: '9 1234 5678', altNames: ['Chile'] },
  { code: 'CN', name: 'Çin', dialCode: '+86', flag: '🇨🇳', digits: 11, mask: '(###) ####-####', example: '138 1234 5678', altNames: ['China'] },
  { code: 'CO', name: 'Kolumbiya', dialCode: '+57', flag: '🇨🇴', digits: 10, mask: '(###) ###-####', example: '300 123 4567', altNames: ['Colombia'] },
  { code: 'CR', name: 'Kosta Rika', dialCode: '+506', flag: '🇨🇷', digits: 8, mask: '####-####', example: '8312 3456', altNames: ['Costa Rica'] },
  { code: 'HR', name: 'Xorvatiya', dialCode: '+385', flag: '🇭🇷', digits: 9, mask: '(##) ###-####', example: '91 123 4567', altNames: ['Croatia'] },
  { code: 'CU', name: 'Kuba', dialCode: '+53', flag: '🇨🇺', digits: 8, mask: '####-####', example: '5123 4567', altNames: ['Cuba'] },
  { code: 'CY', name: 'Kipr', dialCode: '+357', flag: '🇨🇾', digits: 8, mask: '##-###-###', example: '96 123 456', altNames: ['Cyprus'] },
  { code: 'CZ', name: 'Çexiya', dialCode: '+420', flag: '🇨🇿', digits: 9, mask: '(###) ###-###', example: '601 123 456', altNames: ['Czech Republic', 'Czechia'] },

  // D
  { code: 'DK', name: 'Danimarka', dialCode: '+45', flag: '🇩🇰', digits: 8, mask: '##-##-##-##', example: '20 12 34 56', altNames: ['Denmark'] },
  { code: 'DJ', name: 'Cibuti', dialCode: '+253', flag: '🇩🇯', digits: 8, mask: '##-##-##-##', example: '77 12 34 56', altNames: ['Djibouti'] },
  { code: 'DO', name: 'Dominikan Respublikası', dialCode: '+1', flag: '🇩🇴', digits: 10, mask: '(###) ###-####', example: '809 123 4567', altNames: ['Dominican Republic'] },

  // E
  { code: 'EC', name: 'Ekvador', dialCode: '+593', flag: '🇪🇨', digits: 9, mask: '(##) ###-####', example: '99 123 4567', altNames: ['Ecuador'] },
  { code: 'EG', name: 'Misir', dialCode: '+20', flag: '🇪🇬', digits: 10, mask: '(###) ###-####', example: '100 123 4567', altNames: ['Egypt'] },
  { code: 'EE', name: 'Estoniya', dialCode: '+372', flag: '🇪🇪', digits: 8, mask: '####-####', example: '5123 4567', altNames: ['Estonia'] },
  { code: 'ET', name: 'Efiopiya', dialCode: '+251', flag: '🇪🇹', digits: 9, mask: '(##) ###-####', example: '91 123 4567', altNames: ['Ethiopia'] },

  // F
  { code: 'FI', name: 'Finlandiya', dialCode: '+358', flag: '🇫🇮', digits: 9, mask: '(###) ###-###', example: '412 345 678', altNames: ['Finland'] },
  { code: 'FR', name: 'Fransa', dialCode: '+33', flag: '🇫🇷', digits: 9, mask: '(#) ##-##-##-##', example: '6 12 34 56 78', altNames: ['France'] },

  // G
  { code: 'GA', name: 'Qabon', dialCode: '+241', flag: '🇬🇦', digits: 8, mask: '##-##-##-##', example: '06 12 34 56', altNames: ['Gabon'] },
  { code: 'GM', name: 'Qambiya', dialCode: '+220', flag: '🇬🇲', digits: 7, mask: '###-####', example: '991 2345', altNames: ['Gambia'] },
  { code: 'GH', name: 'Qana', dialCode: '+233', flag: '🇬🇭', digits: 9, mask: '(##) ###-####', example: '20 123 4567', altNames: ['Ghana'] },
  { code: 'GR', name: 'Yunanıstan', dialCode: '+30', flag: '🇬🇷', digits: 10, mask: '(###) ###-####', example: '691 234 5678', altNames: ['Greece'] },
  { code: 'GT', name: 'Qvatemala', dialCode: '+502', flag: '🇬🇹', digits: 8, mask: '####-####', example: '5123 4567', altNames: ['Guatemala'] },
  { code: 'GN', name: 'Qvineya', dialCode: '+224', flag: '🇬🇳', digits: 9, mask: '(###) ##-##-##', example: '621 23 45 67', altNames: ['Guinea'] },

  // H
  { code: 'HT', name: 'Haiti', dialCode: '+509', flag: '🇭🇹', digits: 8, mask: '####-####', example: '3412 3456', altNames: ['Haiti'] },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳', digits: 8, mask: '####-####', example: '9123 4567', altNames: ['Honduras'] },
  { code: 'HK', name: 'Honkonq', dialCode: '+852', flag: '🇭🇰', digits: 8, mask: '####-####', example: '9123 4567', altNames: ['Hong Kong'] },
  { code: 'HU', name: 'Macarıstan', dialCode: '+36', flag: '🇭🇺', digits: 9, mask: '(##) ###-####', example: '20 123 4567', altNames: ['Hungary'] },

  // I
  { code: 'IS', name: 'İslandiya', dialCode: '+354', flag: '🇮🇸', digits: 7, mask: '###-####', example: '612 3456', altNames: ['Iceland'] },
  { code: 'IN', name: 'Hindistan', dialCode: '+91', flag: '🇮🇳', digits: 10, mask: '(#####) #####', example: '98123 45678', altNames: ['India'] },
  { code: 'ID', name: 'İndoneziya', dialCode: '+62', flag: '🇮🇩', digits: 10, mask: '(###) ###-####', example: '812 345 6789', altNames: ['Indonesia'] },
  { code: 'IR', name: 'İran', dialCode: '+98', flag: '🇮🇷', digits: 10, mask: '(###) ###-####', example: '912 345 6789', altNames: ['Iran'] },
  { code: 'IQ', name: 'İraq', dialCode: '+964', flag: '🇮🇶', digits: 10, mask: '(###) ###-####', example: '790 123 4567', altNames: ['Iraq'] },
  { code: 'IE', name: 'İrlandiya', dialCode: '+353', flag: '🇮🇪', digits: 9, mask: '(##) ###-####', example: '87 123 4567', altNames: ['Ireland'] },
  { code: 'IL', name: 'İsrail', dialCode: '+972', flag: '🇮🇱', digits: 9, mask: '(##) ###-####', example: '50 123 4567', altNames: ['Israel'] },
  { code: 'IT', name: 'İtaliya', dialCode: '+39', flag: '🇮🇹', digits: 10, mask: '(###) ###-####', example: '312 345 6789', altNames: ['Italy'] },

  // J
  { code: 'JM', name: 'Yamayka', dialCode: '+1', flag: '🇯🇲', digits: 10, mask: '(###) ###-####', example: '876 123 4567', altNames: ['Jamaica'] },
  { code: 'JP', name: 'Yaponiya', dialCode: '+81', flag: '🇯🇵', digits: 10, mask: '(##) ####-####', example: '90 1234 5678', altNames: ['Japan'] },
  { code: 'JO', name: 'İordaniya', dialCode: '+962', flag: '🇯🇴', digits: 9, mask: '(#) ####-####', example: '7 9012 3456', altNames: ['Jordan'] },

  // K
  { code: 'KE', name: 'Keniya', dialCode: '+254', flag: '🇰🇪', digits: 9, mask: '(###) ###-###', example: '712 345 678', altNames: ['Kenya'] },
  { code: 'KR', name: 'Cənubi Koreya', dialCode: '+82', flag: '🇰🇷', digits: 10, mask: '(##) ####-####', example: '10 1234 5678', altNames: ['South Korea', 'Korea'] },
  { code: 'KW', name: 'Küveyt', dialCode: '+965', flag: '🇰🇼', digits: 8, mask: '####-####', example: '9912 3456', altNames: ['Kuwait'] },
  { code: 'KG', name: 'Qırğızıstan', dialCode: '+996', flag: '🇰🇬', digits: 9, mask: '(###) ##-##-##', example: '555 12 34 56', altNames: ['Kyrgyzstan', 'Киргизия'] },

  // L
  { code: 'LV', name: 'Latviya', dialCode: '+371', flag: '🇱🇻', digits: 8, mask: '####-####', example: '2123 4567', altNames: ['Latvia'] },
  { code: 'LB', name: 'Livan', dialCode: '+961', flag: '🇱🇧', digits: 8, mask: '##-###-###', example: '70 123 456', altNames: ['Lebanon'] },
  { code: 'LY', name: 'Liviya', dialCode: '+218', flag: '🇱🇾', digits: 9, mask: '(##) ###-####', example: '91 123 4567', altNames: ['Libya'] },
  { code: 'LT', name: 'Litva', dialCode: '+370', flag: '🇱🇹', digits: 8, mask: '(###) #####', example: '612 34567', altNames: ['Lithuania'] },
  { code: 'LU', name: 'Lüksemburq', dialCode: '+352', flag: '🇱🇺', digits: 9, mask: '(###) ###-###', example: '621 123 456', altNames: ['Luxembourg'] },

  // M
  { code: 'MY', name: 'Malayziya', dialCode: '+60', flag: '🇲🇾', digits: 9, mask: '(##) ###-####', example: '12 345 6789', altNames: ['Malaysia'] },
  { code: 'MV', name: 'Maldiv adaları', dialCode: '+960', flag: '🇲🇻', digits: 7, mask: '###-####', example: '712 3456', altNames: ['Maldives'] },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱', digits: 8, mask: '##-##-##-##', example: '70 12 34 56', altNames: ['Mali'] },
  { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹', digits: 8, mask: '####-####', example: '9912 3456', altNames: ['Malta'] },
  { code: 'MX', name: 'Meksika', dialCode: '+52', flag: '🇲🇽', digits: 10, mask: '(###) ###-####', example: '551 234 5678', altNames: ['Mexico'] },
  { code: 'MD', name: 'Moldova', dialCode: '+373', flag: '🇲🇩', digits: 8, mask: '(###) ##-###', example: '621 12 345', altNames: ['Moldova'] },
  { code: 'MC', name: 'Monako', dialCode: '+377', flag: '🇲🇨', digits: 8, mask: '##-##-##-##', example: '06 12 34 56', altNames: ['Monaco'] },
  { code: 'MN', name: 'Monqolustan', dialCode: '+976', flag: '🇲🇳', digits: 8, mask: '####-####', example: '9912 3456', altNames: ['Mongolia'] },
  { code: 'ME', name: 'Monteneqro', dialCode: '+382', flag: '🇲🇪', digits: 8, mask: '(##) ###-###', example: '67 123 456', altNames: ['Montenegro', 'Çernoqoriya'] },
  { code: 'MA', name: 'Mərakeş', dialCode: '+212', flag: '🇲🇦', digits: 9, mask: '(###) ##-##-##', example: '650 12 34 56', altNames: ['Morocco'] },

  // N
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', digits: 10, mask: '(###) ###-####', example: '984 123 4567', altNames: ['Nepal'] },
  { code: 'NL', name: 'Niderland (Hollandiya)', dialCode: '+31', flag: '🇳🇱', digits: 9, mask: '(#) ##-##-##-##', example: '6 12 34 56 78', altNames: ['Netherlands', 'Holland'] },
  { code: 'NZ', name: 'Yeni Zelandiya', dialCode: '+64', flag: '🇳🇿', digits: 9, mask: '(###) ###-###', example: '211 234 567', altNames: ['New Zealand'] },
  { code: 'NG', name: 'Nigeriya', dialCode: '+234', flag: '🇳🇬', digits: 10, mask: '(###) ###-####', example: '802 123 4567', altNames: ['Nigeria'] },
  { code: 'MK', name: 'Şimali Makedoniya', dialCode: '+389', flag: '🇲🇰', digits: 8, mask: '(##) ###-###', example: '70 123 456', altNames: ['North Macedonia'] },
  { code: 'NO', name: 'Norveç', dialCode: '+47', flag: '🇳🇴', digits: 8, mask: '###-##-###', example: '412 34 567', altNames: ['Norway'] },

  // O
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', digits: 8, mask: '####-####', example: '9123 4567', altNames: ['Oman'] },

  // P
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', digits: 10, mask: '(###) #######', example: '300 1234567', altNames: ['Pakistan'] },
  { code: 'PS', name: 'Fələstin', dialCode: '+970', flag: '🇵🇸', digits: 9, mask: '(##) ###-####', example: '59 123 4567', altNames: ['Palestine'] },
  { code: 'PA', name: 'Panama', dialCode: '+507', flag: '🇵🇦', digits: 8, mask: '####-####', example: '6123 4567', altNames: ['Panama'] },
  { code: 'PY', name: 'Paraqvay', dialCode: '+595', flag: '🇵🇾', digits: 9, mask: '(###) ###-###', example: '981 123 456', altNames: ['Paraguay'] },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', digits: 9, mask: '(###) ###-###', example: '912 345 678', altNames: ['Peru'] },
  { code: 'PH', name: 'Filippin', dialCode: '+63', flag: '🇵🇭', digits: 10, mask: '(###) ###-####', example: '917 123 4567', altNames: ['Philippines'] },
  { code: 'PL', name: 'Polşa', dialCode: '+48', flag: '🇵🇱', digits: 9, mask: '(###) ###-###', example: '512 345 678', altNames: ['Poland'] },
  { code: 'PT', name: 'Portuqaliya', dialCode: '+351', flag: '🇵🇹', digits: 9, mask: '(###) ###-###', example: '912 345 678', altNames: ['Portugal'] },

  // Q
  { code: 'QA', name: 'Qətər', dialCode: '+974', flag: '🇶🇦', digits: 8, mask: '####-####', example: '3312 3456', altNames: ['Qatar'] },

  // R
  { code: 'RO', name: 'Rumıniya', dialCode: '+40', flag: '🇷🇴', digits: 9, mask: '(###) ###-###', example: '712 345 678', altNames: ['Romania'] },

  // S
  { code: 'SN', name: 'Seneqal', dialCode: '+221', flag: '🇸🇳', digits: 9, mask: '(##) ###-##-##', example: '77 123 45 67', altNames: ['Senegal'] },
  { code: 'RS', name: 'Serbiya', dialCode: '+381', flag: '🇷🇸', digits: 9, mask: '(##) ###-####', example: '60 123 4567', altNames: ['Serbia'] },
  { code: 'SG', name: 'Sinqapur', dialCode: '+65', flag: '🇸🇬', digits: 8, mask: '####-####', example: '8123 4567', altNames: ['Singapore'] },
  { code: 'SK', name: 'Slovakiya', dialCode: '+421', flag: '🇸🇰', digits: 9, mask: '(###) ###-###', example: '912 345 678', altNames: ['Slovakia'] },
  { code: 'SI', name: 'Sloveniya', dialCode: '+386', flag: '🇸🇮', digits: 8, mask: '(##) ###-###', example: '40 123 456', altNames: ['Slovenia'] },
  { code: 'ZA', name: 'Cənubi Afrika (CAR)', dialCode: '+27', flag: '🇿🇦', digits: 9, mask: '(##) ###-####', example: '82 123 4567', altNames: ['South Africa', 'CAR'] },
  { code: 'ES', name: 'İspaniya', dialCode: '+34', flag: '🇪🇸', digits: 9, mask: '(###) ##-##-##', example: '612 34 56 78', altNames: ['Spain', 'Espana'] },
  { code: 'LK', name: 'Şri-Lanka', dialCode: '+94', flag: '🇱🇰', digits: 9, mask: '(##) ###-####', example: '71 234 5678', altNames: ['Sri Lanka'] },
  { code: 'SD', name: 'Sudan', dialCode: '+249', flag: '🇸🇩', digits: 9, mask: '(##) ###-####', example: '91 234 5678', altNames: ['Sudan'] },
  { code: 'SE', name: 'İsveç', dialCode: '+46', flag: '🇸🇪', digits: 9, mask: '(##) ###-##-##', example: '70 123 45 67', altNames: ['Sweden'] },
  { code: 'CH', name: 'İsveçrə', dialCode: '+41', flag: '🇨🇭', digits: 9, mask: '(##) ###-##-##', example: '79 123 45 67', altNames: ['Switzerland'] },
  { code: 'SY', name: 'Suriya', dialCode: '+963', flag: '🇸🇾', digits: 9, mask: '(###) ###-###', example: '944 123 456', altNames: ['Syria'] },

  // T
  { code: 'TW', name: 'Tayvan', dialCode: '+886', flag: '🇹🇼', digits: 9, mask: '(###) ###-###', example: '912 345 678', altNames: ['Taiwan'] },
  { code: 'TJ', name: 'Tacikistan', dialCode: '+992', flag: '🇹🇯', digits: 9, mask: '(###) ##-##-##', example: '918 12 34 56', altNames: ['Tajikistan', 'Таджикистан'] },
  { code: 'TZ', name: 'Tanzaniya', dialCode: '+255', flag: '🇹🇿', digits: 9, mask: '(###) ###-###', example: '712 345 678', altNames: ['Tanzania'] },
  { code: 'TH', name: 'Tailand', dialCode: '+66', flag: '🇹🇭', digits: 9, mask: '(##) ###-####', example: '81 234 5678', altNames: ['Thailand'] },
  { code: 'TN', name: 'Tunis', dialCode: '+216', flag: '🇹🇳', digits: 8, mask: '##-###-###', example: '20 123 456', altNames: ['Tunisia'] },
  { code: 'TM', name: 'Türkmənistan', dialCode: '+993', flag: '🇹🇲', digits: 8, mask: '(##) ##-##-##', example: '65 12 34 56', altNames: ['Turkmenistan', 'Туркменистан'] },

  // U
  { code: 'UG', name: 'Uqanda', dialCode: '+256', flag: '🇺🇬', digits: 9, mask: '(###) ###-###', example: '772 123 456', altNames: ['Uganda'] },
  { code: 'UY', name: 'Uruqvay', dialCode: '+598', flag: '🇺🇾', digits: 8, mask: '####-####', example: '9123 4567', altNames: ['Uruguay'] },

  // V
  { code: 'VE', name: 'Venesuela', dialCode: '+58', flag: '🇻🇪', digits: 10, mask: '(###) ###-####', example: '412 123 4567', altNames: ['Venezuela'] },
  { code: 'VN', name: 'Vyetnam', dialCode: '+84', flag: '🇻🇳', digits: 9, mask: '(##) ####-####', example: '91 2345 6789', altNames: ['Vietnam'] },

  // Y & Z
  { code: 'YE', name: 'Yəmən', dialCode: '+967', flag: '🇾🇪', digits: 9, mask: '(###) ###-###', example: '712 345 678', altNames: ['Yemen'] },
  { code: 'ZM', name: 'Zambiya', dialCode: '+260', flag: '🇿🇲', digits: 9, mask: '(##) ###-####', example: '97 123 4567', altNames: ['Zambia'] },
  { code: 'ZW', name: 'Zimbabve', dialCode: '+263', flag: '🇿🇼', digits: 9, mask: '(##) ###-####', example: '77 123 4567', altNames: ['Zimbabwe'] },
];

export const formatPhoneDigits = (digits: string, mask: string): string => {
  let digitIndex = 0;
  let result = '';
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      result += digits[digitIndex++];
    } else {
      result += mask[i];
    }
  }
  return result;
};
