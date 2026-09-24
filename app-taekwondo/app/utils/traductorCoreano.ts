// Motor de traducción fonética oficial (Español a Hangul / Coreano)
export const traducirACoreanoOficial = (textoEspanol: string): string => {
  if (!textoEspanol) return '';
  
  let texto = textoEspanol.toUpperCase().trim();

  const diccionario: { [key: string]: string } = {
    'JUAN': '주안',
    'JOSE': '호세',
    'CARLOS': '카를로스',
    'MARTIN': '마르틴',
    'DIEGO': '디에고',
    'PABLO': '파블로',
    'LUIS': '루이스',
    'ALEJANDRO': '알레한드로',
    'MATIAS': '마티아스',
    'NICOLAS': '니콜라스',
    'FRANCO': '프랑코',
    'AGUSTIN': '아구스틴',
    'SANTIAGO': '산티아고',
    'LUCAS': '루카스',
    'MATEO': '마테오',
    'MARIA': '마리아',
    'ANA': '아나',
    'VALENTINA': '발렌티나',
    'LUCIA': '루시아',
    'CAMILA': '카밀라'
  };

  if (diccionario[texto]) {
    return diccionario[texto];
  }

  const mapaSilabas: { [key: string]: string } = {
    'CH': '치', 'LL': '이', 'RR': '르', 'QU': '케', 'GU': '구',
    'BA': '바', 'BE': '베', 'BI': '비', 'BO': '보', 'BU': '부',
    'CA': '카', 'CE': '세', 'CI': '시', 'CO': '코', 'CU': '쿠',
    'DA': '다', 'DE': '데', 'DI': '디', 'DO': '도', 'DU': '두',
    'FA': '파', 'FE': '페', 'FI': '피', 'FO': '포', 'FU': '푸',
    'GA': '가', 'GE': '헤', 'GI': '히', 'GO': '고', 'GU': '구',
    'HA': '하', 'HE': '헤', 'HI': '히', 'HO': '호', 'HU': '후',
    'LA': '라', 'LE': '레', 'LI': '리', 'LO': '로', 'LU': '루',
    'MA': '마', 'ME': '메', 'MI': '미', 'MO': '모', 'MU': '무',
    'NA': '나', 'NE': '네', 'NI': '니', 'NO': '노', 'NU': '누',
    'PA': '파', 'PE': '페', 'PI': '피', 'PO': '포', 'PU': '푸',
    'RA': '라', 'RE': '레', 'RI': '리', 'RO': '로', 'RU': '루',
    'SA': '사', 'SE': '세', 'SI': '시', 'SO': '소', 'SU': '수',
    'TA': '타', 'TE': '테', 'TI': '티', 'TO': '토', 'TU': '투',
    'A': '아', 'E': '에', 'I': '이', 'O': '오', 'U': '우',
    'N': 'ㄴ', 'S': '스', 'R': 'ㄹ', 'L': 'ㄹ', 'M': 'ㅁ'
  };

  let resultado = '';
  let i = 0;
  while (i < texto.length) {
    let chunk2 = texto.substr(i, 2);
    if (mapaSilabas[chunk2]) {
      resultado += mapaSilabas[chunk2];
      i += 2;
    } else {
      let chunk1 = texto.substr(i, 1);
      resultado += mapaSilabas[chunk1] || chunk1;
      i += 1;
    }
  }

  return resultado;
};