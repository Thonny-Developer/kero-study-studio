import type { IconName } from '../lib/icons'

export type ObKey = 'goal' | 'level' | 'mins'

export interface ObOption {
  id: string | number
  label: string
  sub?: string
  icon?: IconName
  tag?: string
}

export interface ObStep {
  key: ObKey
  title: string
  sub: string
  opts: ObOption[]
}

export const ONBOARDING: ObStep[] = [
  {
    key: 'goal',
    title: 'Зачем тебе это?',
    sub: 'Подстрою программу под цель. Поменять можно в любой момент.',
    opts: [
      { id: 'launch', label: 'Запустить свой проект', sub: 'От идеи до первых юзеров', icon: 'rocket' },
      { id: 'job', label: 'Найти работу', sub: 'AI-навыки и портфолио в резюме', icon: 'target' },
      { id: 'free', label: 'Фриланс', sub: 'Сайты, боты и креативы на заказ', icon: 'spark' },
    ],
  },
  {
    key: 'level',
    title: 'Насколько ты в теме?',
    sub: 'Честно. Я не осуждаю, я робот.',
    opts: [
      { id: 'zero', label: 'С нуля', sub: 'ChatGPT пару раз открывал', icon: 'spark' },
      { id: 'some', label: 'Немного шарю', sub: 'Писал промпты, видел код', icon: 'code' },
      { id: 'pro', label: 'Уверенно', sub: 'Уже что-то запускал', icon: 'rocket' },
    ],
  },
  {
    key: 'mins',
    title: 'Сколько минут в день?',
    sub: 'Даже 5 минут в день — это 30 часов за год.',
    opts: [
      { id: 5, label: 'Лайтово' },
      { id: 10, label: 'Норм', tag: 'ТОП' },
      { id: 15, label: 'Серьёзно' },
      { id: 20, label: 'Хардкор' },
    ],
  },
]
