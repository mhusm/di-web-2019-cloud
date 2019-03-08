<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <input
      type="file"
      id="imageupload"
      name="imageupload"
      accept="image/png, image/jpeg"
      ref="fileinput"
    >
    <button @click="upload">Upload</button>
    <img :src="cloudimage">
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "home",
  data: function() {
    return {
      files: null,
      cloudimage: ""
    };
  },
  components: {
    HelloWorld
  },
  methods: {
    upload: function() {
      let data = new FormData();
      data.append("file", this.$refs.fileinput.files[0]);

      fetch("/uploads", {
        method: "POST",
        body: data
      })
      .then(response => {
        return response.text();
      })
      .then(mytext => {
        console.log(mytext);
        this.cloudimage = mytext;
      });
    }
  }
};
</script>
