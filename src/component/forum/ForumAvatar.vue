<script setup lang="ts">
import { ref } from 'vue';
import defaultAvatarImg from '../../static/img/avatar-default.jpg';
import avatarPlaceholderImg from '../../static/img/avatar-placeholder.png';
import avatarErrorImg from '../../static/img/avatar-error.png';
import { getImageIwara } from '../../core/api';

export interface AvatarUser {
  id: string;
  avatar: {
    id: string;
    path: string;
    name: string;
  } | null;
}

const props = defineProps<{
  user: AvatarUser
}>()

const avatarUrl = ref<string>(avatarPlaceholderImg);

async function loadAvatar() {
  const user = props.user;
  if (!user) {
    avatarUrl.value = defaultAvatarImg;
    return;
  }

  try {
    if (!user.avatar) {
      avatarUrl.value = defaultAvatarImg;
    } else {
      const avatarImageUrl = `https://i.iwara.tv/image/avatar/${user.avatar.id}/${user.avatar.name}`;
      avatarUrl.value = await getImageIwara(avatarImageUrl);
    }
  } catch (error) {
    console.error('Failed to load avatar:', error);
    avatarUrl.value = avatarErrorImg;
  }
}

loadAvatar();
</script>

<template>
  <v-img :src="avatarUrl" cover>
    <template v-slot:placeholder>
      <v-img height="100%" :src="avatarPlaceholderImg" cover></v-img>
    </template>
  </v-img>
</template>
