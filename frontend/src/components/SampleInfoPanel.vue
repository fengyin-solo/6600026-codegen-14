<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSequenceStore } from '../store/sequence';
import type { SampleInfo } from '../types';

const store = useSequenceStore();
const isEditing = ref(false);
const editForm = ref<SampleInfo>({
  species: '',
  collectionDate: '',
  collectionLocation: '',
  collector: '',
  tissueType: '',
  storageCondition: '',
  notes: ''
});

const selectedSequence = computed(() => {
  return store.sequences.find(s => s.id === store.selectedSeqForPanel);
});

watch(selectedSequence, (seq) => {
  if (seq) {
    editForm.value = { ...seq.sampleInfo };
  }
  isEditing.value = false;
}, { immediate: true });

function startEdit() {
  if (selectedSequence.value) {
    editForm.value = { ...selectedSequence.value.sampleInfo };
    isEditing.value = true;
  }
}

function saveEdit() {
  if (selectedSequence.value) {
    store.updateSampleInfo(selectedSequence.value.id, { ...editForm.value });
    isEditing.value = false;
  }
}

function cancelEdit() {
  if (selectedSequence.value) {
    editForm.value = { ...selectedSequence.value.sampleInfo };
  }
  isEditing.value = false;
}
</script>

<template>
  <section class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
    <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-300">样本备注与采集信息</h2>
      <div class="flex items-center gap-2">
        <select
          v-model="store.selectedSeqForPanel"
          class="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-gray-100 text-xs focus:outline-none focus:border-emerald-500"
        >
          <option value="" disabled>选择序列</option>
          <option v-for="seq in store.sequences" :key="seq.id" :value="seq.id">
            {{ seq.name }}
          </option>
        </select>
        <button
          v-if="selectedSequence && !isEditing"
          @click="startEdit"
          class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
        >
          编辑
        </button>
        <template v-if="isEditing">
          <button
            @click="saveEdit"
            class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded transition-colors"
          >
            保存
          </button>
          <button
            @click="cancelEdit"
            class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
          >
            取消
          </button>
        </template>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="px-4 py-2 bg-gray-850 border-b border-gray-700 flex items-center gap-2 flex-wrap" style="background-color: #1a2234;">
      <div class="flex items-center gap-1 text-xs text-gray-400">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        筛选:
      </div>
      <input
        :value="store.filterKeyword"
        @input="store.setFilterKeyword(($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="搜索名称/备注/地点/采集者"
        class="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-xs placeholder-gray-500 focus:outline-none focus:border-emerald-500 flex-1 min-w-[180px]"
      />
      <select
        :value="store.filterSpecies"
        @change="store.setFilterSpecies(($event.target as HTMLSelectElement).value)"
        class="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-xs focus:outline-none focus:border-emerald-500"
      >
        <option value="">全部物种</option>
        <option v-for="sp in store.speciesList" :key="sp" :value="sp">
          {{ sp }}
        </option>
      </select>
      <button
        @click="store.clearFilters"
        v-if="store.filterKeyword || store.filterSpecies"
        class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors border border-gray-600"
      >
        清除筛选
      </button>
      <span v-if="store.filterKeyword || store.filterSpecies" class="text-xs text-gray-500">
        匹配 {{ store.filteredSequences.length }} / {{ store.sequences.length }} 条
      </span>
    </div>

    <div class="p-4">
      <div v-if="!selectedSequence" class="text-center py-8 text-gray-500 text-sm">
        请先选择一条序列以查看样本信息
      </div>

      <!-- View Mode -->
      <div v-else-if="!isEditing" class="space-y-4">
        <div class="bg-gray-900 rounded border border-gray-700 px-4 py-3">
          <div class="text-xs text-gray-500 mb-1">序列名称</div>
          <div class="text-gray-100 font-medium">{{ selectedSequence.name }}</div>
          <div class="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>ID: <span class="text-cyan-400 font-mono">{{ selectedSequence.id }}</span></span>
            <span>长度: <span class="text-emerald-400">{{ selectedSequence.length }} bp</span></span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">物种学名</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.species">{{ selectedSequence.sampleInfo.species }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">采集日期</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.collectionDate">{{ selectedSequence.sampleInfo.collectionDate }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">采集地点</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.collectionLocation">{{ selectedSequence.sampleInfo.collectionLocation }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">采集者</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.collector">{{ selectedSequence.sampleInfo.collector }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">组织类型</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.tissueType">{{ selectedSequence.sampleInfo.tissueType }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-500">保存条件</label>
            <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[36px]">
              <template v-if="selectedSequence.sampleInfo.storageCondition">{{ selectedSequence.sampleInfo.storageCondition }}</template>
              <span v-else class="text-gray-600 italic">未填写</span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs text-gray-500 mb-1">备注说明</label>
          <div class="text-sm text-gray-200 px-3 py-2 bg-gray-900 rounded border border-gray-700 min-h-[80px] whitespace-pre-wrap">
            <template v-if="selectedSequence.sampleInfo.notes">{{ selectedSequence.sampleInfo.notes }}</template>
            <span v-else class="text-gray-600 italic">暂无备注</span>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="space-y-4">
        <div class="bg-gray-900 rounded border border-emerald-700 px-4 py-3">
          <div class="text-xs text-emerald-500 mb-1">正在编辑</div>
          <div class="text-gray-100 font-medium">{{ selectedSequence.name }}</div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">物种学名</label>
            <input
              v-model="editForm.species"
              type="text"
              placeholder="例如: Homo sapiens"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">采集日期</label>
            <input
              v-model="editForm.collectionDate"
              type="date"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">采集地点</label>
            <input
              v-model="editForm.collectionLocation"
              type="text"
              placeholder="例如: 北京, 中国"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">采集者</label>
            <input
              v-model="editForm.collector"
              type="text"
              placeholder="例如: 李研究员"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">组织类型</label>
            <input
              v-model="editForm.tissueType"
              type="text"
              placeholder="例如: 血液/肝脏/毛发"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div class="space-y-1">
            <label class="block text-xs text-gray-400">保存条件</label>
            <input
              v-model="editForm.storageCondition"
              type="text"
              placeholder="例如: -80°C 冷冻"
              class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs text-gray-400">备注说明</label>
          <textarea
            v-model="editForm.notes"
            rows="4"
            placeholder="输入样本相关的备注信息..."
            class="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>
      </div>
    </div>
  </section>
</template>
