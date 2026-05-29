<template>
  <main id="app">
    <router-view />
  </main>
</template>

<script>
export default {};
</script>

<style lang="scss">
body,
html {
  width: 100%;
  height: 100%;
  background-color: #eee;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

a {
  color: unset;
  &:visited {
    color: unset;
  }
}

:root {
  --highlight-bg: #fff;
}

@media (prefers-color-scheme: dark) {
  body,
  html {
    background-color: #333333;
  }
  :root {
    --highlight-bg: #494949;
  }
}

body.darkmode:not(.darkmode-off) {
  background-color: #333333;
  :root {
    --highlight-bg: #494949;
  }
}
</style>
