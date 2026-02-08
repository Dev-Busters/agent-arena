'use client'

import { useState } from 'react'
import { MODEL_PRICING, ModelType } from '@/utils/costCalculator'

interface ModelSelectorProps {
  selected: ModelType
  onChange: (model: ModelType) => void
  showPricing?: boolean
}

export function ModelSelector({ selected, onChange, showPricing = true }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const models: ModelType[] = ['haiku', 'sonnet', 'opus']

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-900/50 border border-primary/20 rounded-lg text-left hover:border-primary/50 transition flex items-center justify-between"
      >
        <div>
          <p className="text-xs text-gray-400 font-medium">API Model</p>
          <p className="font-bold text-white capitalize flex items-center gap-2">
            {selected === 'haiku' && '⚡'}
            {selected === 'sonnet' && '⚙️'}
            {selected === 'opus' && '🧠'}
            {MODEL_PRICING[selected].displayName}
          </p>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-primary/30 rounded-lg overflow-hidden shadow-lg z-50">
          {models.map((model) => {
            const pricing = MODEL_PRICING[model]
            return (
              <button
                key={model}
                onClick={() => {
                  onChange(model)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-left transition hover:bg-primary/20 border-b border-gray-700 last:border-b-0 ${
                  selected === model ? 'bg-primary/30 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white capitalize flex items-center gap-2">
                      {model === 'haiku' && '⚡'}
                      {model === 'sonnet' && '⚙️'}
                      {model === 'opus' && '🧠'}
                      {pricing.displayName}
                    </p>
                    {showPricing && (
                      <p className="text-xs text-gray-400 mt-1">
                        ${pricing.inputPerMillionTokens} / $
                        {pricing.outputPerMillionTokens} per 1M tokens
                      </p>
                    )}
                  </div>
                  {model === 'haiku' && (
                    <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded">
                      Fast & Cheap
                    </span>
                  )}
                  {model === 'sonnet' && (
                    <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                      Balanced
                    </span>
                  )}
                  {model === 'opus' && (
                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">
                      Most Capable
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
