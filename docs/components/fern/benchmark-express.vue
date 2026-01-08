<template>
    <div class="result flex flex-col flex-1 from-sky-200 to-purple-200 dark:from-sky-900 dark:to-purple-900 bg-gradient-to-br rounded-2xl">
        <article class="result-inner flex flex-col gap-3 p-5 bg-white dark:bg-slate-800">
            <ol class="graph flex flex-col flex-1 gap-1 m-0 px-0 py-2">
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <h6 class="w-26 min-w-26 font-mono text-lg font-medium text-gray-500 dark:text-gray-400">
                        <span
                            class="!text-xl !font-semibold !text-transparent !ml-0 text-gradient from-violet-500 to-sky-500"
                        >
                            Vafast
                        </span>
                    </h6>
                    <div
                        class="flex justify-end items-center w-full h-6 font-bold font-mono text-sm pr-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 !text-white"
                    >
                        2,454,631 reqs/s
                    </div>
                </li>
                <li class="flex justify-start items-center gap-4 w-full h-6">
                    <h6 class="w-26 min-w-26 font-mono text-lg font-medium text-gray-500 dark:text-gray-400">Express</h6>
                    <div class="flex justify-end items-center h-6 font-bold font-mono text-gray-500 dark:text-gray-400 text-sm pr-3 bg-gray-200 dark:bg-gray-600 rounded-2xl" style="width: 4.61%" />
                    <p class="font-medium font-mono text-gray-400 text-sm -translate-x-2">113,117</p>
                </li>
            </ol>
            <p class="text-sm !m-0 text-gray-400 !leading-normal">
                Measured in requests/second. Result from
                <a
                    href="https://www.techempower.com/benchmarks/#hw=ph&test=plaintext&section=data-r22"
                    target="_blank"
                    class="underline"
                    >TechEmpower Benchmark</a
                >
                Round 22 (2023-10-17) in PlainText
            </p>
        </article>
    </div>
</template>

<style scoped>
.result {
    padding: 1.5px;
}

.result-inner {
    border-radius: calc(var(--radius-2xl) - 1.5px);
}
</style>
