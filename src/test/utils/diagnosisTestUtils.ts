import { DiagnosisData } from '../../../types'

// 診断データの管理
let currentDiagnosisData: DiagnosisData = {
  age: '',
  experience: '',
  purpose: '',
  amount: '',
  timing: ''
}

// 年代選択
export const selectAge = (age: string): void => {
  currentDiagnosisData.age = age
}

// 投資経験選択
export const selectExperience = (experience: string): void => {
  currentDiagnosisData.experience = experience
}

// 投資目的選択
export const selectPurpose = (purpose: string): void => {
  currentDiagnosisData.purpose = purpose
}

// 投資金額選択
export const selectAmount = (amount: string): void => {
  currentDiagnosisData.amount = amount
}

// 投資時期選択
export const selectTiming = (timing: string): void => {
  currentDiagnosisData.timing = timing
}

// 現在の選択値を取得
export const getSelectedAge = (): string => currentDiagnosisData.age
export const getSelectedExperience = (): string => currentDiagnosisData.experience
export const getSelectedPurpose = (): string => currentDiagnosisData.purpose
export const getSelectedAmount = (): string => currentDiagnosisData.amount
export const getSelectedTiming = (): string => currentDiagnosisData.timing

// 診断データをリセット
export const resetDiagnosisData = (): void => {
  currentDiagnosisData = {
    age: '',
    experience: '',
    purpose: '',
    amount: '',
    timing: ''
  }
}

// 完全な診断データを取得
export const getDiagnosisData = (): DiagnosisData => {
  return { ...currentDiagnosisData }
}

// 診断データが完全かチェック
export const isDiagnosisComplete = (): boolean => {
  return !!(
    currentDiagnosisData.age &&
    currentDiagnosisData.experience &&
    currentDiagnosisData.purpose &&
    currentDiagnosisData.amount &&
    currentDiagnosisData.timing
  )
} 