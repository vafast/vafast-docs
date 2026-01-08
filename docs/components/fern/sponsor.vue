<template>
    <section
        class="relative max-w-5xl w-full mx-auto py-20 px-6"
        ref="scope"
    >
        <!-- 标题 -->
        <div class="text-center mb-12">
            <motion.h2
                class="text-4xl md:text-5xl font-bold mb-4"
                v-bind="flyIn()"
            >
                <span
                    class="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500"
                >
                    由你实现
                </span>
            </motion.h2>
            <motion.p
                class="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto"
                v-bind="flyIn(0.1)"
            >
                Vafast 不是由某个组织拥有，而是由社区推动。您的支持让 Vafast
                得以持续发展。
            </motion.p>
        </div>

        <!-- CTA 按钮 -->
        <motion.div class="flex justify-center mb-16" v-bind="flyIn(0.2)">
            <a
                class="inline-flex items-center gap-2 px-8 py-3 text-white font-semibold bg-gradient-to-r from-rose-500 to-pink-500 rounded-full shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105"
                href="https://github.com/vafast/vafast"
                target="_blank"
            >
                成为赞助商
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                </svg>
            </a>
        </motion.div>

        <!-- Gold Sponsors -->
        <section v-if="goldSponsors.length" class="mb-12">
            <motion.h4
                class="text-2xl font-semibold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500"
                v-bind="flyIn(0.3)"
            >
                Gold Sponsors
            </motion.h4>
            <motion.ul
                class="flex flex-wrap justify-center gap-6"
                v-bind="flyIn(0.4)"
            >
                <li v-for="sponsor in goldSponsors" :key="sponsor.sponsorEntity.login">
                    <a
                        :href="`https://github.com/${sponsor.sponsorEntity.login}`"
                        target="_blank"
                        class="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <img
                            v-if="sponsor.sponsorEntity.avatarUrl"
                            :src="sponsor.sponsorEntity.avatarUrl"
                            :alt="sponsor.sponsorEntity.login"
                            class="w-16 h-16 rounded-full"
                        />
                        <div>
                            <p class="font-semibold text-gray-800 dark:text-gray-100">
                                {{ sponsor.sponsorEntity.name ?? sponsor.sponsorEntity.login }}
                            </p>
                            <p class="text-sm text-gray-500">{{ sponsor.duration }}</p>
                        </div>
                    </a>
                </li>
            </motion.ul>
        </section>

        <!-- Silver Sponsors -->
        <section v-if="silverSponsors.length" class="mb-12">
            <motion.h4
                class="text-xl font-semibold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-500"
                v-bind="flyIn(0.4)"
            >
                Silver Sponsors
            </motion.h4>
            <motion.ul
                class="flex flex-wrap justify-center gap-4"
                v-bind="flyIn(0.5)"
            >
                <li v-for="sponsor in silverSponsors" :key="sponsor.sponsorEntity.login">
                    <a
                        :href="`https://github.com/${sponsor.sponsorEntity.login}`"
                        target="_blank"
                        class="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <img
                            v-if="sponsor.sponsorEntity.avatarUrl"
                            :src="sponsor.sponsorEntity.avatarUrl"
                            :alt="sponsor.sponsorEntity.login"
                            class="w-12 h-12 rounded-full"
                        />
                        <div>
                            <p class="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                {{ sponsor.sponsorEntity.name ?? sponsor.sponsorEntity.login }}
                            </p>
                            <p class="text-xs text-gray-500">{{ sponsor.duration }}</p>
                        </div>
                    </a>
                </li>
            </motion.ul>
        </section>

        <!-- Individual Sponsors -->
        <section v-if="individualSponsors.length">
            <motion.h4
                class="text-lg font-semibold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400"
                v-bind="flyIn(0.5)"
            >
                Individual Sponsors
            </motion.h4>
            <motion.ul
                class="flex flex-wrap justify-center gap-4"
                v-bind="flyIn(0.6)"
            >
                <li v-for="sponsor in individualSponsors" :key="sponsor.sponsorEntity.login">
                    <a
                        :href="`https://github.com/${sponsor.sponsorEntity.login}`"
                        target="_blank"
                        class="flex flex-col items-center p-4 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors"
                    >
                        <img
                            v-if="sponsor.sponsorEntity.avatarUrl"
                            :src="sponsor.sponsorEntity.avatarUrl"
                            :alt="sponsor.sponsorEntity.login"
                            class="w-12 h-12 rounded-full mb-2"
                        />
                        <p class="text-sm text-gray-600 dark:text-gray-300">
                            {{ sponsor.sponsorEntity.name ?? sponsor.sponsorEntity.login }}
                        </p>
                    </a>
                </li>
                <li>
                    <a
                        href="https://github.com/vafast/vafast"
                        target="_blank"
                        class="flex flex-col items-center p-4 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-500/10 transition-colors"
                    >
                        <div
                            class="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-500/20 flex items-center justify-center mb-2"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                class="text-pink-500"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </div>
                        <p class="text-sm font-medium text-pink-500">And you</p>
                    </a>
                </li>
            </motion.ul>
        </section>

        <!-- 感谢语 -->
        <motion.p
            class="text-center text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mt-12"
            v-bind="flyIn(0.7)"
        >
            Thank you for making Vafast possible
        </motion.p>
    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useInView, motion } from 'motion-v'
import { useFlyIn } from './animate'

import { data, type Sponsor } from './sponsor.data'

const scope = ref(null)
const isInView = useInView(scope, {
    once: true,
    margin: '0px 0px -20% 0px'
} as Parameters<typeof useInView>[1])
const flyIn = useFlyIn(isInView)

const sponsors: Sponsor[] = data

const goldSponsors = sponsors.filter(
    (sponsor) => sponsor.tier.monthlyPriceInDollars >= 200
)
const silverSponsors = sponsors.filter(
    (sponsor) =>
        sponsor.tier.monthlyPriceInDollars >= 75 &&
        sponsor.tier.monthlyPriceInDollars < 200
)
const individualSponsors = sponsors.filter(
    (sponsor) => sponsor.tier.monthlyPriceInDollars < 75
)
</script>
