import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Sequence, AlignmentResult, GCContent, PhyloNode, SampleInfo } from '../types';
import {
  needlemanWunsch,
  smithWaterman,
  calculateGCContent,
  calculateDistanceMatrix,
  buildNJTree,
  MOCK_SEQUENCES
} from '../utils/alignment';

const DEFAULT_SAMPLE_INFO: SampleInfo = {
  species: '',
  collectionDate: '',
  collectionLocation: '',
  collector: '',
  tissueType: '',
  storageCondition: '',
  notes: ''
};

const MOCK_SAMPLE_INFO: Record<string, SampleInfo> = {
  human: {
    species: 'Homo sapiens',
    collectionDate: '2024-03-15',
    collectionLocation: '北京, 中国',
    collector: '李研究员',
    tissueType: '血液',
    storageCondition: '-80°C 冷冻',
    notes: '健康志愿者样本，COI基因片段，用于人种遗传学研究'
  },
  chimp: {
    species: 'Pan troglodytes',
    collectionDate: '2024-01-20',
    collectionLocation: '昆明动物研究所',
    collector: '王教授',
    tissueType: '毛发毛囊',
    storageCondition: '液氮保存',
    notes: '黑猩猩样本，灵长类进化对比研究'
  },
  gorilla: {
    species: 'Gorilla gorilla',
    collectionDate: '2023-11-08',
    collectionLocation: '喀麦隆野外',
    collector: '国际灵长类保护组织',
    tissueType: '粪便(无创采样)',
    storageCondition: 'RNAlater 缓冲液',
    notes: '西部低地大猩猩，濒危物种保护遗传学研究'
  },
  mouse: {
    species: 'Mus musculus',
    collectionDate: '2024-04-02',
    collectionLocation: '实验室动物房',
    collector: '张技术员',
    tissueType: '肝脏组织',
    storageCondition: '-80°C 冷冻',
    notes: 'C57BL/6J品系，对照组动物'
  },
  zebrafish: {
    species: 'Danio rerio',
    collectionDate: '2024-02-28',
    collectionLocation: '上海模式生物中心',
    collector: '陈实验室',
    tissueType: '全鱼',
    storageCondition: 'Trizol 试剂',
    notes: '野生型AB系，发育生物学研究'
  }
};

export const useSequenceStore = defineStore('sequence', () => {
  const sequences = ref<Sequence[]>([]);
  const alignmentResult = ref<AlignmentResult | null>(null);
  const currentAlgorithm = ref<'nw' | 'sw'>('nw');
  const gcData = ref<GCContent[]>([]);
  const phyloTree = ref<PhyloNode | null>(null);
  const selectedSeq1 = ref<string>('');
  const selectedSeq2 = ref<string>('');
  const selectedSeqForPanel = ref<string>('');
  const filterKeyword = ref<string>('');
  const filterSpecies = ref<string>('');

  const alignmentIdentity = computed(() => {
    return alignmentResult.value ? alignmentResult.value.identity : 0;
  });

  const alignmentScore = computed(() => {
    return alignmentResult.value ? alignmentResult.value.score : 0;
  });

  const speciesList = computed(() => {
    const species = new Set<string>();
    sequences.value.forEach(s => {
      if (s.sampleInfo.species) species.add(s.sampleInfo.species);
    });
    return Array.from(species).sort();
  });

  const filteredSequences = computed(() => {
    return sequences.value.filter(s => {
      const matchKeyword = !filterKeyword.value ||
        s.name.toLowerCase().includes(filterKeyword.value.toLowerCase()) ||
        s.sampleInfo.notes.toLowerCase().includes(filterKeyword.value.toLowerCase()) ||
        s.sampleInfo.collectionLocation.toLowerCase().includes(filterKeyword.value.toLowerCase()) ||
        s.sampleInfo.collector.toLowerCase().includes(filterKeyword.value.toLowerCase());
      const matchSpecies = !filterSpecies.value || s.sampleInfo.species === filterSpecies.value;
      return matchKeyword && matchSpecies;
    });
  });

  function addSequence(id: string, name: string, data: string, sampleInfo?: Partial<SampleInfo>) {
    const info: SampleInfo = { ...DEFAULT_SAMPLE_INFO, ...sampleInfo };
    sequences.value.push({
      id,
      name,
      data: data.toUpperCase().replace(/[^ACGT]/g, ''),
      length: data.length,
      sampleInfo: info
    });
  }

  function updateSampleInfo(seqId: string, sampleInfo: SampleInfo) {
    const seq = sequences.value.find(s => s.id === seqId);
    if (seq) {
      seq.sampleInfo = { ...sampleInfo };
    }
  }

  function removeSequence(id: string) {
    sequences.value = sequences.value.filter(s => s.id !== id);
    if (selectedSeqForPanel.value === id) {
      selectedSeqForPanel.value = '';
    }
  }

  function runAlignment(seq1Id: string, seq2Id: string, algorithm: 'nw' | 'sw') {
    const s1 = sequences.value.find(s => s.id === seq1Id);
    const s2 = sequences.value.find(s => s.id === seq2Id);

    if (!s1 || !s2) return;

    currentAlgorithm.value = algorithm;

    if (algorithm === 'nw') {
      alignmentResult.value = needlemanWunsch(s1.data, s2.data);
    } else {
      alignmentResult.value = smithWaterman(s1.data, s2.data);
    }
  }

  function loadMockSequences() {
    sequences.value = [];
    for (const mock of MOCK_SEQUENCES) {
      const info = MOCK_SAMPLE_INFO[mock.id] || DEFAULT_SAMPLE_INFO;
      addSequence(mock.id, mock.name, mock.data, info);
    }
    selectedSeq1.value = MOCK_SEQUENCES[0].id;
    selectedSeq2.value = MOCK_SEQUENCES[1].id;
    selectedSeqForPanel.value = MOCK_SEQUENCES[0].id;
  }

  function buildTree() {
    if (sequences.value.length < 2) return;

    const seqData = sequences.value.map(s => ({ name: s.name, data: s.data }));
    const distMatrix = calculateDistanceMatrix(seqData);
    const names = sequences.value.map(s => s.name);
    phyloTree.value = buildNJTree(distMatrix, names);
  }

  function analyzeGC(seqId: string, windowSize: number) {
    const seq = sequences.value.find(s => s.id === seqId);
    if (!seq) return;
    gcData.value = calculateGCContent(seq.data, windowSize);
  }

  function setFilterKeyword(keyword: string) {
    filterKeyword.value = keyword;
  }

  function setFilterSpecies(species: string) {
    filterSpecies.value = species;
  }

  function clearFilters() {
    filterKeyword.value = '';
    filterSpecies.value = '';
  }

  function setSelectedSeqForPanel(seqId: string) {
    selectedSeqForPanel.value = seqId;
  }

  return {
    sequences,
    alignmentResult,
    currentAlgorithm,
    gcData,
    phyloTree,
    selectedSeq1,
    selectedSeq2,
    selectedSeqForPanel,
    filterKeyword,
    filterSpecies,
    alignmentIdentity,
    alignmentScore,
    speciesList,
    filteredSequences,
    addSequence,
    updateSampleInfo,
    removeSequence,
    runAlignment,
    loadMockSequences,
    buildTree,
    analyzeGC,
    setFilterKeyword,
    setFilterSpecies,
    clearFilters,
    setSelectedSeqForPanel
  };
});
