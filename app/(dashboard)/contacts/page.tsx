'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserOrgId } from '@/lib/org-helpers'
import { Plus, Search, Filter } from 'lucide-react'
import ContactsTable from '@/components/contacts/ContactsTable'
import CreateContactModal from '@/components/contacts/CreateContactModal'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import UpgradeCTA, { UpgradeButton } from '@/components/shared/UpgradeCTA'
import { useIndustry } from '@/lib/contexts/IndustryContext'
import { useUsageLimits } from '@/lib/contexts/UsageLimitsContext'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)
  const supabase = createClient()
  const { terminology } = useIndustry()
  const { contacts: contactLimits, refresh: refreshLimits } = useUsageLimits()

  useEffect(() => {
    const initOrg = async () => {
      const id = await getCurrentUserOrgId()
      setOrgId(id)
    }
    initOrg()
  }, [])

  useEffect(() => {
    if (orgId) {
      loadContacts()
    }
  }, [orgId])

  const loadContacts = async () => {
    if (!orgId) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('contacts')
      .select(`
        *,
        companies(id, name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (data) setContacts(data)
    setLoading(false)
  }

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search) ||
      contact.companies?.name?.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{terminology.contacts}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{contacts.length} total {terminology.contacts.toLowerCase()}</p>
        </div>
        {contactLimits.atLimit ? (
          <UpgradeButton resource="contacts" />
        ) : (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary w-full sm:w-auto">
            <Plus size={18} className="mr-2" />
            Add {terminology.contact}
          </button>
        )}
      </div>

      {/* Limit Warning */}
      {contactLimits.atLimit && (
        <UpgradeCTA resource="contacts" current={contactLimits.current} max={contactLimits.max} />
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${terminology.contacts.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button className="btn btn-secondary">
          <Filter size={16} className="mr-2" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <ContactsTable contacts={filteredContacts} />
      </div>

      {showCreateModal && (
        <CreateContactModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false)
            loadContacts()
            refreshLimits()
          }} 
        />
      )}
    </div>
  )
}
