import { defineLoader } from 'vitepress'

export interface Sponsor {
    sponsorEntity: {
        login: string
        name: string
        avatarUrl: string
    }
    createdAt: string
    tier: {
        isOneTime: boolean
        isCustomAmount: boolean
        monthlyPriceInDollars: number
    }
    duration: string
}

declare const data: Sponsor[]
export { data }

export default defineLoader({
    async load(): Promise<Sponsor[]> {
        // Vafast 目前没有赞助者列表
        return []
    }
})
