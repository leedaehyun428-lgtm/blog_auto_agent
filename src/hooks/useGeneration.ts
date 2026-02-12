import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { analyzeKeyword, generateBlogPost, searchInfo } from '../api';
import type { ThemeType } from '../api';
import { supabase } from '../supabaseClient';

interface AnalysisItem {
  keyword: string;
  totalSearch: number;
  totalClick: string;
  compIdx: string;
}

interface AnalysisData {
  main: AnalysisItem;
  recommendations: AnalysisItem[];
}

interface ExposureGuide {
  charCount: number;
  imgCount: number;
  keywordCount: number;
}

interface UseGenerationParams {
  user: User | null;
  keyword: string;
  setKeywordError: (value: string) => void;
  isTestMode: boolean;
  selectedTheme: ThemeType;
  useGuide: boolean;
  guide: string;
  volts: number;
  handleLogin: () => void;
  requestConfirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }) => Promise<boolean>;
  saveToHistory: (keyword: string, content: string) => Promise<void>;
  setVolts: Dispatch<SetStateAction<number>>;
  setIsLoading: (value: boolean) => void;
  setResult: (value: string) => void;
  setCopyStatus: (value: string) => void;
  setStep: (value: 'idle' | 'searching' | 'writing' | 'done') => void;
  setResultIsTestMode: (value: boolean) => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisData: Dispatch<SetStateAction<AnalysisData | null>>;
  setExposureGuide: Dispatch<SetStateAction<ExposureGuide | null>>;
  setKeyword: (value: string) => void;
  setIsMobileView: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
  setGuide: (value: string) => void;
  setUseGuide: (value: boolean) => void;
  setSelectedPromptId: (value: string) => void;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const PAYMENT_ERROR = '볼트가 부족하거나 결제 중 오류가 발생했습니다. 충전이 필요할 수 있습니다.';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return '알 수 없는 오류';
}

function getDetailedError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const response = record.response as Record<string, unknown> | undefined;
    const data = response?.data as Record<string, unknown> | undefined;
    const innerError = data?.error as Record<string, unknown> | undefined;
    const message = innerError?.message;
    if (typeof message === 'string') return message;
  }
  return getErrorMessage(error);
}

export function useGeneration({
  user,
  keyword,
  setKeywordError,
  isTestMode,
  selectedTheme,
  useGuide,
  guide,
  volts,
  handleLogin,
  requestConfirm,
  saveToHistory,
  setVolts,
  setIsLoading,
  setResult,
  setCopyStatus,
  setStep,
  setResultIsTestMode,
  setIsAnalyzing,
  setAnalysisData,
  setExposureGuide,
  setKeyword,
  setIsMobileView,
  setIsEditing,
  setGuide,
  setUseGuide,
  setSelectedPromptId,
  notify,
}: UseGenerationParams) {
  const handleAnalyze = async () => {
    if (!user) {
      const shouldLogin = await requestConfirm({
        title: '로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인하고 무료로 분석해볼까요?',
        confirmText: '로그인',
        cancelText: '취소',
      });
      if (shouldLogin) handleLogin();
      return;
    }
    if (!keyword.trim()) {
      setKeywordError('키워드를 입력해주세요.');
      return;
    }
    setKeywordError('');

    setIsAnalyzing(true);
    setAnalysisData(null);
    setExposureGuide(null);

    try {
      const keywordData = await analyzeKeyword(keyword);
      setAnalysisData(keywordData as AnalysisData);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const guideData = await response.json();

      setExposureGuide({
        charCount: guideData.averageCharCount,
        imgCount: guideData.averageImageCount,
        keywordCount: guideData.keywordCount,
      });
    } catch {
      notify('error', '분석에 실패했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      const shouldLogin = await requestConfirm({
        title: '로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인하고 서비스를 이용해볼까요?',
        confirmText: '로그인',
        cancelText: '취소',
      });
      if (shouldLogin) handleLogin();
      return;
    }

    if (!keyword.trim()) {
      setKeywordError('키워드를 입력해주세요.');
      return;
    }
    setKeywordError('');
    const shouldProceed = await requestConfirm({
      title: '볼트 차감 확인',
      message: `⚡ 10 볼트가 차감됩니다.\n(현재 잔액: ${volts} V)\n\n진행하시겠습니까?`,
      confirmText: '진행',
      cancelText: '취소',
    });
    if (!shouldProceed) return;

    setIsLoading(true);
    setResult('');
    setCopyStatus('idle');

    try {
      const { data: isSuccess, error: payError } = await supabase
        .rpc('deduct_volts', { row_id: user.id, amount: 10 });

      if (payError || !isSuccess) {
        throw new Error(PAYMENT_ERROR);
      }

      setVolts((prev) => prev - 10);

      setStep('searching');
      const searchData = await searchInfo(keyword, isTestMode, selectedTheme);

      setStep('writing');
      const blogPost = await generateBlogPost(
        keyword,
        searchData,
        selectedTheme,
        useGuide ? guide : undefined,
      );

      setResult(blogPost);
      setResultIsTestMode(isTestMode);
      setStep('done');
      await saveToHistory(keyword, blogPost);

      await supabase.from('generation_logs').insert({
        user_id: user.id,
        keyword,
        theme: selectedTheme,
        used_volts: 10,
        status: 'success',
      });
    } catch (error: unknown) {
      console.error(error);
      const message = getErrorMessage(error);

      if (message !== PAYMENT_ERROR) {
        await supabase.rpc('refund_volts', { row_id: user.id, amount: 10 });
        setVolts((prev) => prev + 10);

        notify('info', `오류로 차감된 10 볼트가 자동 환불되었습니다: ${message}`);

        const detailedError = getDetailedError(error);

        await supabase.from('generation_logs').insert({
          user_id: user.id,
          keyword,
          status: 'refunded',
          error_message: detailedError,
        });

        notify('error', `오류 발생: ${detailedError}`);
      } else {
        notify('error', message);
      }

      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const resetToHome = () => {
    setStep('idle');
    setKeyword('');
    setResult('');
    setAnalysisData(null);
    setIsMobileView(false);
    setIsEditing(false);
    setGuide('');
    setUseGuide(false);
    setSelectedPromptId('');
    setKeywordError('');
  };

  return {
    handleAnalyze,
    handleGenerate,
    resetToHome,
  };
}
