<template>
    <article
        class="mockup-browser dark:bg-slate-800 border dark:border-slate-700 playground rounded-2xl"
    >
        <div class="mockup-browser-toolbar flex justify-between w-full px-4 py-2">
            <div class="input flex justify-start items-center gap-1 w-full max-w-sm px-3 rounded-lg bg-neutral-100 dark:bg-slate-700 overflow-hidden">
                <span>localhost</span>
                <select
                    name="route"
                    class="select text-blue-500 font-bold px-1 bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-500/25 dark:hover:bg-blue-500/40 border border-solid border-blue-500/50 dark:border-blue-500/75 rounded cursor-pointer transition-colors"
                    v-model="current"
                >
                    <option
                        v-for="{ method, path } in routes"
                        :key="method + '_' + path"
                        :value="{ method, path }"
                    >
                        {{ alias && path in alias ? alias[path] : path }}
                    </option>
                </select>
            </div>
            <p
                class="!my-0 font-bold pl-2 min-w-[5ch] text-right"
                :class="
                    current.method === 'GET'
                        ? 'text-green-600'
                        : 'text-blue-500'
                "
            >
                {{ current.method }}
            </p>
        </div>
        <section
            class="flex justify-start items-stretch w-full h-full px-4 whitespace-pre-wrap pb-3"
            style="min-height: 16rem"
        >
            {{ response }}
        </section>
    </article>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Server } from 'vafast'

const {
    server,
    mock = {},
    alias = {}
} = defineProps<{
    server: Server
    mock?: Record<string, Record<string, string>>
    alias?: Record<string, string>
}>()

const routes = server?.routes

const current = ref({
    method: routes?.[0]?.method ?? 'get',
    path: routes?.[0]?.path ?? '/'
})

const response = ref('')

const compute = async () => {
    const { method, path } = current.value

    if (mock && path in mock && method in mock[path]) {
        response.value = mock[path][method]
        return
    }

    const res = await server
        .fetch(
            new Request('http://vafast.dev' + path, {
                method
            })
        )
        .then((x) => x.text())

    response.value = res
}

compute()
watch([current], compute)
</script>

<style scoped>
.playground {
    box-shadow: 0 7px 25px rgba(0, 0, 0, 0.0625);
}

.mockup-browser-toolbar::before {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    margin-right: 3.5rem;
    margin-top: auto;
    margin-bottom: auto;
    border-radius: 0.5rem;
    opacity: 0.3;
    content: '';
    transform: translateX(-0.8rem);
    box-shadow:
        0.8em 0,
        2em 0,
        3.2em 0;
}

@media screen and (max-width: 567.9px) {
    .mockup-browser-toolbar {
        padding-left: 0.7em;
        padding-right: 0.7em;
    }

    .mockup-browser-toolbar::before {
        display: none !important;
    }
}
</style>
