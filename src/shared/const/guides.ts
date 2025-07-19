import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const guides = [
    {
        id: 'divan_free',
        title: 'Гайд: Как избавиться от запаха (БЕСПЛАТНО)',
        description: 'Полная инструкция по спасению дивана, квартиры и нервов от неприятного запаха! Реально работает - проверенно! 😻',
        filename: 'ИЗБАВЛЯЕМСЯ_ОТ_ЗАПАХА_ГАЙД_LISA_KISA56.pdf',
        path: path.join(__dirname, '../../../guides/lisaFreeGuide.pdf'),
        isFree: true,
        paymentLink: "",
    }
];
