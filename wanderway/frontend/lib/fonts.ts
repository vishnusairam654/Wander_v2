import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// Google Fonts
export const inter = Inter({ subsets: ['latin'], variable: '--font-inter-custom' })

// Local Fonts (from public/fonts/)
export const calfinedemo = localFont({
    src: '../public/fonts/Calfinedemo.otf',
    variable: '--font-calfinedemo-custom',
})

export const harmondExtraBold = localFont({
    src: '../public/fonts/Harmond-ExtraBoldExpanded.otf',
    variable: '--font-harmond-extrabold-custom',
})

export const harmondSemiBoldItalic = localFont({
    src: '../public/fonts/Harmond-SemBdItaCond.otf',
    variable: '--font-harmond-semibold-italic-custom',
})

export const mamenchisa = localFont({
    src: '../public/fonts/Mamenchisa.otf',
    variable: '--font-mamenchisa-custom',
})

export const milkyWalky = localFont({
    src: '../public/fonts/MilkyWalky-Regular.otf',
    variable: '--font-milkywalky-custom',
})

export const eagle = localFont({
    src: '../public/fonts/EagleHorizonP.ttf',
    variable: '--font-eagle-custom',
})

export const FONTS = {
    inter,
    localFonts: {
        calfinedemo,
        harmondExtraBold,
        harmondSemiBoldItalic,
        mamenchisa,
        milkyWalky,
        eagle,
    }
} as const;

export type LocalFontName = keyof typeof FONTS.localFonts;
