<script setup lang="ts">
import { useData } from 'vitepress'

const { site } = useData()
</script>

<template>
    <img
        :src="`${site.base}assets/vafast_v.webp`"
        alt="Curved text logo saying 'Elysia JS'"
        class="h-[64px]"
    />
</template>
