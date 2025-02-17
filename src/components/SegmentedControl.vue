<script setup lang="ts">
import {ref, onMounted, computed, useTemplateRef, watch} from 'vue';

const props = defineProps<{
  options: string[]
  selectedIndex: number
}>();

const emit = defineEmits(['update:selectedIndex']);

const mountedSelectedIndex = ref(0);
const pressActive = ref(false);
const pressActiveIndex = ref(null as null|number);
const resizeObserver = ref(null as null|ResizeObserver);

const hockeyPuck = useTemplateRef('hockey-puck');
const buttons = useTemplateRef('buttons');

const optionWidth = computed(() => {
  const numberOfOptions = props.options.length;
  return `calc((100% - (${numberOfOptions} - 1) * ${gapWidth.value}) / ${numberOfOptions})`;
});
const gapWidth = computed(() => {
  return '4px';
});
const selectedOptionPositionLeft = computed(() => {
  const selectedOption = mountedSelectedIndex.value;
  const numberOfOptions = props.options.length;
  const buttonWidthsToSubtract = `(${optionWidth.value} * (${numberOfOptions} - ${selectedOption}))`;
  const gapsToSubtract = `(${gapWidth.value} * (${numberOfOptions} - ${selectedOption} - 1))`;
  return `calc(100% - ${buttonWidthsToSubtract} - ${gapsToSubtract})`;
});

const selectedOptionTransformationOrigin = computed(() => {
  const selectedOption = mountedSelectedIndex.value;
  const numberOfOptions = props.options.length;
  return `calc(100% * (${selectedOption + 1} / ${numberOfOptions + 1}))`;
});

function buttonsResizeCallback(entries: ResizeObserverEntry[]) {
  entries.forEach((entry) => {
    if (hockeyPuck.value === null) {
      // hockeyPuck does not exist, probably because it was unmounted
      return;
    }
    hockeyPuck.value.style.height = `${entry.contentRect.height}px`;
  });
}

function selectButtonCallback(event: Event) {
  const button = event.target as HTMLButtonElement;
  const buttonIndex = getIndexOfButton(button);
  selectButton(buttonIndex);
}

function mouseDownCallback(event: MouseEvent | TouchEvent) {
  // Left mouse button only
  if ('button' in event && event.button !== 0) {
    return;
  }
  const point = getPointFromEvent(event);
  const buttonIndex = getIndexOfButtonAtPoint(point);
  if (buttonIndex === null) {
    return;
  }
  pressActive.value = true;
  pressActiveIndex.value = buttonIndex;
}

function mouseMoveCallback(event: MouseEvent | TouchEvent) {
  if (!pressActive.value) {
    return;
  }
  const point = getPointFromEvent(event);
  const buttonIndex = getIndexOfButtonAtPoint(point);
  if (buttonIndex === null) {
    return;
  }
  if (pressActiveIndex.value === mountedSelectedIndex.value) {
    selectButton(buttonIndex);
  } else if (mountedSelectedIndex.value !== buttonIndex && buttonIndex != null) {
    pressActiveIndex.value = buttonIndex;
  } else {
    pressActiveIndex.value = null;
  }
}

function mouseUpCallback(event: MouseEvent | TouchEvent) {
  if (!pressActive.value) {
    return;
  }
  const point = getPointFromEvent(event);
  const buttonIndex = getIndexOfButtonAtPoint(point);
  if (buttonIndex === null) {
    pressActive.value = false;
    return;
  }
  selectButton(buttonIndex);
  pressActive.value = false;
}

function touchStartCallback(event: TouchEvent) {
  event.preventDefault();
  mouseDownCallback(event);
}

function touchMoveCallback(event: TouchEvent) {
  event.preventDefault();
  mouseMoveCallback(event);
}

function selectButton(index: number) {
  mountedSelectedIndex.value = index;
  pressActiveIndex.value = index;
}

function selectButtonToTheLeft() {
  selectButton(Math.max(0, mountedSelectedIndex.value - 1));
  getButtons()[mountedSelectedIndex.value].focus();
}

function selectButtonToTheRight() {
  selectButton(Math.min(props.options.length - 1, mountedSelectedIndex.value + 1));
  getButtons()[mountedSelectedIndex.value].focus();
}

function getPointFromEvent(event: TouchEvent | MouseEvent): Touch | MouseEvent {
  if ('changedTouches' in event) {
    return event.changedTouches[0];
  }
  return event;
}

function getIndexOfButtonAtPoint(point: Touch | MouseEvent): number | null {
  const buttonIndex = getButtons()
      .findIndex((button) => {
        const rect = button.getBoundingClientRect();
        return (
            (point.clientX >= rect.x)
            && (point.clientX <= rect.x + rect.width)
        );
      });
  if (buttonIndex === -1) {
    return null;
  }
  return buttonIndex;
}

function getIndexOfButton(button: HTMLButtonElement) {
  return getButtons().indexOf(button);
}

function getButtonsContainer(): HTMLDivElement {
  if (buttons.value === null) {
    throw new Error('Invalid state: Button container does not exist');
  }
  return buttons.value;
}

function getButtons() {
  return Array.from(getButtonsContainer().querySelectorAll('button'));
}

watch(() => (props.selectedIndex), () => {
  mountedSelectedIndex.value = props.selectedIndex;
});

watch(mountedSelectedIndex, () => {
  emit('update:selectedIndex', mountedSelectedIndex.value);
});

onMounted(() => {
  mountedSelectedIndex.value = props.selectedIndex;
  const buttonsContainer = getButtonsContainer();
  resizeObserver.value = new ResizeObserver(buttonsResizeCallback);
  resizeObserver.value.observe(buttonsContainer);

  // Handle mouse-movements. We attach listeners to the document to allow
  // tracking changes outside the button section.
  buttonsContainer.addEventListener('mousedown', mouseDownCallback);
  document.addEventListener('mousemove', mouseMoveCallback);
  document.addEventListener('mouseup', mouseUpCallback);

  // Handle touch-movements.
  buttonsContainer.addEventListener('touchstart', touchStartCallback);
  buttonsContainer.addEventListener('touchmove', touchMoveCallback);
  buttonsContainer.addEventListener('touchend', mouseUpCallback);
});
</script>

<template>
  <div>
    <div
      class="relative"
    >
      <div
        class="
          transform
          transition-transform ease-out duration-300
          translate-x-(--selected-option-position-left)
        "
        :style="{
          '--selected-option-position-left': selectedOptionPositionLeft,
        }"
      >
        <div
          ref="hockey-puck"
          class="
            p-2
            absolute
            bg-white
            dark:bg-white/20
            rounded-lg
            shadow-lg
            dark:shadow-lg
            transform
            transition-transform ease-out duration-300
          "
          :class="{ 'scale-95': pressActive && mountedSelectedIndex === pressActiveIndex }"
          :style="{
            width: optionWidth,
            'transform-origin': `${selectedOptionTransformationOrigin} center`,
          }"
        />
      </div>
    </div>
    <div
      ref="buttons"
      class="w-full relative flex"
    >
      <template
        v-for="(item, index) in options"
        :key="index"
      >
        <div
          v-if="index > 0"
          class="select-none py-2"
          :style="{ width: gapWidth }"
        >
          <span
            class="
                mx-auto block
                w-0.5 h-full
                bg-black dark:bg-white
                rounded-lg
                transition-opacity ease-out duration-300
              "
            :class="{
              'opacity-10 dark:opacity-20': !(
                (index - 1 === mountedSelectedIndex) || (index === mountedSelectedIndex)
              ),
              'opacity-0': (
                (index - 1 === mountedSelectedIndex) || (index === mountedSelectedIndex)
              ),
            }"
          />
        </div>
        <button
          v-if="item !== null"
          type="button"
          class="
            py-2 rounded-lg
            overflow-hidden
            text-ellipsis
            transform transition ease-out duration-300
            cursor-pointer
            text-sm leading-5
          "
          :class="{
            'scale-95': (
              index === pressActiveIndex && pressActive && index === mountedSelectedIndex
            ),
          }"
          :style="{ width: optionWidth }"
          @click="selectButtonCallback"
          @keydown.left="selectButtonToTheLeft"
          @keydown.right="selectButtonToTheRight"
        >
          <span
            class="transition transform flex ease-out duration-300 pointer-events-none justify-center items-center"
            :class="{
              'opacity-100 scale-95': index === mountedSelectedIndex,
              'opacity-70': (
                index !== mountedSelectedIndex && (!pressActive || index !== pressActiveIndex)
              ),
              'opacity-50': (
                index === pressActiveIndex && index !== mountedSelectedIndex && pressActive
              ),
            }"
            :style="{
              'transform-origin': `${selectedOptionTransformationOrigin} center`,
            }"
          >
            {{ item }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
button {
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}
button {
  font-size: 11px;
}
@media (min-width: 19em) {
  button {
    font-size: 14px;
  }
}
@media (min-width: 38em) {
  html {
    font-size: 20px;
  }
}
</style>
