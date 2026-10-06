// 首页组件国际化：按 VitePress 当前 localeIndex 选择文案
// Home component i18n: picks messages by the active VitePress localeIndex
import { computed } from 'vue'
import { useData } from 'vitepress'

import zh, { type Messages } from './zh'
import en from './en'

export const messages: Record<string, Messages> = {
    root: zh,
    en
}

export function useI18n() {
    const { localeIndex } = useData()

    const locale = computed(() =>
        localeIndex.value in messages ? localeIndex.value : 'root'
    )

    /** 当前语言的全部文案 / all messages for the active locale */
    const m = computed(() => messages[locale.value])

    /** 将站内路径映射到当前语言 / map an internal path to the active locale */
    const localePath = (path: string) =>
        locale.value === 'root' ? path : `/${locale.value}${path}`

    return { locale, m, localePath }
}
