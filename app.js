/**
 * LeadGen.AI — Frontend Application Controller
 * Handles UI interactions, state management, and DOM updates.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Default Key from User Request (Configure in settings modal to store securely in localStorage)
    const DEFAULT_API_KEY = '';

    // Application State
    const state = {
        leads: [],
        filteredLeads: [],
        activeFilter: 'all',
        isGenerating: false,
        apiKey: localStorage.getItem('groq_api_key') || DEFAULT_API_KEY,
        currentLead: null,
        isEditingEmail: false
    };

    // Instantiate Generator
    const generator = new LeadGenerator(state.apiKey);

    // DOM Elements
    const elements = {
        leadCriteriaForm: document.getElementById('leadCriteriaForm'),
        industryInput: document.getElementById('industryInput'),
        locationInput: document.getElementById('locationInput'),
        targetCustomerInput: document.getElementById('targetCustomerInput'),
        valuePropInput: document.getElementById('valuePropInput'),
        generateLeadsBtn: document.getElementById('generateLeadsBtn'),
        
        // View States
        emptyState: document.getElementById('emptyState'),
        loadingState: document.getElementById('loadingState'),
        resultsState: document.getElementById('resultsState'),
        
        // Progress elements
        progressBarFill: document.getElementById('progressBarFill'),
        loadingCriteriaText: document.getElementById('loadingCriteriaText'),
        carouselConsole: document.getElementById('carouselConsole'),
        steps: [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4')
        ],
        
        // Results elements
        resultsSummaryText: document.getElementById('resultsSummaryText'),
        leadsGrid: document.getElementById('leadsGrid'),
        exportCsvBtn: document.getElementById('exportCsvBtn'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        examplePills: document.querySelectorAll('.example-pill'),
        
        // Drawer elements
        detailDrawer: document.getElementById('detailDrawer'),
        drawerOverlay: document.getElementById('drawerOverlay'),
        closeDrawerBtn: document.getElementById('closeDrawerBtn'),
        drawerCompanyName: document.getElementById('drawerCompanyName'),
        drawerCompanyLogo: document.getElementById('drawerCompanyLogo'),
        drawerCompanyWebsite: document.getElementById('drawerCompanyWebsite'),
        drawerWebsiteText: document.getElementById('drawerWebsiteText'),
        drawerScoreValue: document.getElementById('drawerScoreValue'),
        drawerScoreCircle: document.getElementById('drawerScoreCircle'),
        drawerScoreTier: document.getElementById('drawerScoreTier'),
        drawerScoreReasoning: document.getElementById('drawerScoreReasoning'),
        drawerContactName: document.getElementById('drawerContactName'),
        drawerContactRole: document.getElementById('drawerContactRole'),
        drawerContactEmail: document.getElementById('drawerContactEmail'),
        drawerContactPhone: document.getElementById('drawerContactPhone'),
        drawerContactLinkedIn: document.getElementById('drawerContactLinkedIn'),
        drawerEmailSubject: document.getElementById('drawerEmailSubject'),
        drawerEmailBody: document.getElementById('drawerEmailBody'),
        editEmailToggle: document.getElementById('editEmailToggle'),
        copyEmailBtn: document.getElementById('copyEmailBtn'),
        
        // Settings Modal elements
        settingsBtn: document.getElementById('settingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
        saveSettingsBtn: document.getElementById('saveSettingsBtn'),
        resetDefaultApiBtn: document.getElementById('resetDefaultApiBtn'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        togglePasswordBtn: document.getElementById('togglePasswordBtn'),
        apiStatusBadge: document.getElementById('apiStatusBadge'),
        
        // Toast Container
        toastContainer: document.getElementById('toastContainer')
    };

    // Initialize UI Icons
    lucide.createIcons();
    updateApiStatusUI();

    /* ==========================================================================
       EVENT LISTENERS
       ========================================================================== */

    // 1. Submit targeting form
    elements.leadCriteriaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state.isGenerating) return;

        const criteria = {
            industry: elements.industryInput.value.trim(),
            location: elements.locationInput.value.trim(),
            targetCustomer: elements.targetCustomerInput.value.trim(),
            valueProp: elements.valuePropInput.value.trim()
        };

        await runLeadGeneration(criteria);
    });

    // 2. Click Example Pills
    elements.examplePills.forEach(pill => {
        pill.addEventListener('click', () => {
            elements.industryInput.value = pill.getAttribute('data-industry');
            elements.locationInput.value = pill.getAttribute('data-location');
            elements.targetCustomerInput.value = pill.getAttribute('data-target');
            elements.valuePropInput.value = pill.getAttribute('data-value');
            showToast('Applied example settings', 'info');
        });
    });

    // 3. Settings Modal Toggle
    elements.settingsBtn.addEventListener('click', () => {
        elements.apiKeyInput.value = state.apiKey;
        elements.settingsModal.classList.remove('hidden');
    });

    const closeSettings = () => {
        elements.settingsModal.classList.add('hidden');
    };
    elements.closeSettingsBtn.addEventListener('click', closeSettings);
    elements.cancelSettingsBtn.addEventListener('click', closeSettings);

    elements.saveSettingsBtn.addEventListener('click', () => {
        const key = elements.apiKeyInput.value.trim();
        state.apiKey = key;
        localStorage.setItem('groq_api_key', key);
        generator.setApiKey(key);
        updateApiStatusUI();
        closeSettings();
        showToast('Settings saved successfully', 'success');
    });

    elements.resetDefaultApiBtn.addEventListener('click', () => {
        elements.apiKeyInput.value = DEFAULT_API_KEY;
        showToast('Restored pre-loaded API Key', 'info');
    });

    elements.togglePasswordBtn.addEventListener('click', () => {
        const type = elements.apiKeyInput.type === 'password' ? 'text' : 'password';
        elements.apiKeyInput.type = type;
        const icon = elements.togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.setAttribute('data-lucide', 'eye-off');
        } else {
            icon.setAttribute('data-lucide', 'eye');
        }
        lucide.createIcons();
    });

    // 4. Detail Drawer Close
    const closeDrawer = () => {
        elements.detailDrawer.classList.remove('open');
        // Reset email edit state
        if (state.isEditingEmail) {
            toggleEmailEdit();
        }
    };
    elements.closeDrawerBtn.addEventListener('click', closeDrawer);
    elements.drawerOverlay.addEventListener('click', closeDrawer);

    // 5. Email Editing & Copying
    elements.editEmailToggle.addEventListener('click', toggleEmailEdit);
    
    elements.copyEmailBtn.addEventListener('click', () => {
        const emailBody = elements.drawerEmailBody.value;
        const subject = elements.drawerEmailSubject.innerText;
        const fullContent = `Subject: ${subject}\n\n${emailBody}`;
        
        navigator.clipboard.writeText(fullContent).then(() => {
            showToast('Email content copied to clipboard!', 'success');
        }).catch(err => {
            showToast('Failed to copy text', 'error');
        });
    });

    // Handle generic copy attributes
    document.querySelectorAll('.copy-tiny-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-copy');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const text = targetEl.innerText || targetEl.value;
                navigator.clipboard.writeText(text).then(() => {
                    showToast('Copied to clipboard!', 'success');
                });
            }
        });
    });

    // 6. Filtering
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filter = tab.getAttribute('data-filter');
            state.activeFilter = filter;
            filterAndRenderLeads();
        });
    });

    // 7. CSV Export
    elements.exportCsvBtn.addEventListener('click', () => {
        exportLeadsToCsv();
    });


    /* ==========================================================================
       CORE FUNCTIONS
       ========================================================================== */

    /**
     * Run search logic, advance progress stages, and display results.
     */
    async function runLeadGeneration(criteria) {
        state.isGenerating = true;
        
        // Reset Loading Screen Step Classes
        elements.steps.forEach((step, idx) => {
            step.className = `step ${idx === 0 ? 'active' : ''}`;
            step.querySelector('.step-status').innerText = idx === 0 ? 'In progress...' : 'Waiting...';
        });
        elements.progressBarFill.style.width = '0%';
        elements.carouselConsole.innerHTML = '<div class="console-line">Initializing targeting algorithms...</div>';

        // Swap Viewports
        elements.emptyState.classList.add('hidden');
        elements.resultsState.classList.add('hidden');
        elements.loadingState.classList.remove('hidden');
        elements.loadingCriteriaText.innerText = `Targeting ${criteria.targetCustomer} in ${criteria.location} (${criteria.industry})`;

        // Disable search button
        elements.generateLeadsBtn.disabled = true;
        elements.generateLeadsBtn.querySelector('.btn-text').innerText = 'Processing...';

        try {
            // Start generation via class
            const leads = await generator.generate(criteria, (stepIndex, statusMsg) => {
                updateProgressUI(stepIndex, statusMsg);
            });
            
            state.leads = leads;
            state.activeFilter = 'all';
            
            // Activate All filter tab
            elements.filterTabs.forEach(t => {
                if (t.getAttribute('data-filter') === 'all') t.classList.add('active');
                else t.classList.remove('active');
            });

            // Transition to Results State
            elements.loadingState.classList.add('hidden');
            elements.resultsState.classList.remove('hidden');
            
            filterAndRenderLeads();
            showToast(`Found ${leads.length} high-matching leads!`, 'success');

        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
            
            // Go back to empty state or stay on setup
            elements.loadingState.classList.add('hidden');
            if (state.leads.length > 0) {
                elements.resultsState.classList.remove('hidden');
            } else {
                elements.emptyState.classList.remove('hidden');
            }
        } finally {
            state.isGenerating = false;
            elements.generateLeadsBtn.disabled = false;
            elements.generateLeadsBtn.querySelector('.btn-text').innerText = 'Generate Leads';
        }
    }

    /**
     * Updates loading screen metrics and simulates a running script console
     */
    function updateProgressUI(stepIndex, message) {
        // Step logic (1-based index)
        const stepPct = (stepIndex / 4) * 100;
        elements.progressBarFill.style.width = `${stepPct}%`;

        // Update step bullet items
        elements.steps.forEach((step, idx) => {
            const currentIdx = idx + 1;
            if (currentIdx < stepIndex) {
                step.className = 'step complete';
                step.querySelector('.step-status').innerText = 'Complete';
            } else if (currentIdx === stepIndex) {
                step.className = 'step active';
                step.querySelector('.step-status').innerText = 'In progress...';
            } else {
                step.className = 'step';
                step.querySelector('.step-status').innerText = 'Waiting...';
            }
        });

        // Add styled console prints
        const line = document.createElement('div');
        line.className = 'console-line';
        
        if (stepIndex === 1) line.className += ' success';
        else if (stepIndex === 3) line.className += ' accent';
        
        line.innerHTML = `&gt; [STAGE ${stepIndex}] ${message}`;
        elements.carouselConsole.appendChild(line);
        elements.carouselConsole.scrollTop = elements.carouselConsole.scrollHeight;
    }

    /**
     * Apply lead tier filters and rebuild lead cards grid
     */
    function filterAndRenderLeads() {
        if (state.activeFilter === 'all') {
            state.filteredLeads = state.leads;
        } else {
            state.filteredLeads = state.leads.filter(lead => {
                const tier = getScoreTier(lead.score);
                return tier.toLowerCase() === state.activeFilter;
            });
        }

        // Summary Text
        elements.resultsSummaryText.innerText = `Found ${state.filteredLeads.length} leads in total`;

        // Build Cards
        elements.leadsGrid.innerHTML = '';
        
        if (state.filteredLeads.length === 0) {
            elements.leadsGrid.innerHTML = `
                <div class="empty-grid-card">
                    <i data-lucide="info"></i>
                    <p>No leads found in the "${state.activeFilter}" category.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        state.filteredLeads.forEach(lead => {
            const card = document.createElement('div');
            card.className = 'lead-card';
            
            const tier = getScoreTier(lead.score);
            const badgeClass = `badge-${tier.toLowerCase()}`;
            const scoreClass = tier.toLowerCase();
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="lead-company-group">
                        <div class="company-logo-avatar">${lead.name.charAt(0)}</div>
                        <div class="company-meta">
                            <h4>${lead.name}</h4>
                            <a href="https://${lead.website}" target="_blank" class="company-url" onclick="event.stopPropagation();">
                                <span>${lead.website}</span>
                                <i data-lucide="external-link"></i>
                            </a>
                        </div>
                    </div>
                    <span class="badge ${badgeClass}">${tier}</span>
                </div>
                
                <div class="card-body">
                    <p class="lead-desc">${lead.description}</p>
                    <div class="lead-contact-summary">
                        <div class="contact-row">
                            <i data-lucide="user"></i>
                            <span><strong>${lead.contactName}</strong> (${lead.contactRole})</span>
                        </div>
                        <div class="contact-row">
                            <i data-lucide="mail"></i>
                            <span>${lead.contactEmail}</span>
                        </div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="score-badge">
                        <span class="score-num ${scoreClass}">${lead.score}%</span>
                        <span>match</span>
                    </div>
                    <span class="view-action">
                        <span>View Outreach</span>
                        <i data-lucide="arrow-right"></i>
                    </span>
                </div>
            `;
            
            // Open detail drawer on click
            card.addEventListener('click', () => {
                openLeadDrawer(lead);
            });

            elements.leadsGrid.appendChild(card);
        });

        lucide.createIcons();
    }

    /**
     * Render detailed specs for a selected lead inside the drawer panel
     */
    function openLeadDrawer(lead) {
        state.currentLead = lead;
        
        elements.drawerCompanyName.innerText = lead.name;
        elements.drawerCompanyLogo.innerText = lead.name.charAt(0);
        elements.drawerWebsiteText.innerText = lead.website;
        elements.drawerCompanyWebsite.href = `https://${lead.website}`;
        
        // Score circle SVG styling (dasharray: 220 total)
        elements.drawerScoreValue.innerText = lead.score;
        
        const tier = getScoreTier(lead.score);
        elements.drawerScoreTier.className = `score-tier badge badge-${tier.toLowerCase()}`;
        elements.drawerScoreTier.innerText = `${tier} Lead`;
        
        const offset = 220 - (220 * lead.score) / 100;
        elements.drawerScoreCircle.style.strokeDashoffset = offset;
        
        // Score indicator color
        let circleColor = 'var(--accent-primary)'; // Indigo default
        if (tier === 'Hot') circleColor = 'var(--accent-danger)';
        else if (tier === 'Warm') circleColor = 'var(--accent-warning)';
        else if (tier === 'Cool') circleColor = 'var(--accent-info)';
        elements.drawerScoreCircle.style.stroke = circleColor;

        elements.drawerScoreReasoning.innerText = lead.scoreReasoning;
        
        // Contact details
        elements.drawerContactName.innerText = lead.contactName;
        elements.drawerContactRole.innerText = lead.contactRole;
        elements.drawerContactEmail.innerText = lead.contactEmail;
        elements.drawerContactPhone.innerText = lead.contactPhone;
        elements.drawerContactLinkedIn.innerText = lead.contactLinkedIn;
        elements.drawerContactLinkedIn.href = `https://${lead.contactLinkedIn}`;

        // Email copy template
        elements.drawerEmailSubject.innerText = lead.emailSubject;
        elements.drawerEmailBody.value = lead.emailBody;

        // Open
        elements.detailDrawer.classList.add('open');
    }

    /**
     * Toggle email textarea editable properties
     */
    function toggleEmailEdit() {
        state.isEditingEmail = !state.isEditingEmail;
        const textarea = elements.drawerEmailBody;
        const btn = elements.editEmailToggle;
        
        if (state.isEditingEmail) {
            textarea.removeAttribute('readonly');
            textarea.focus();
            btn.classList.add('editing');
            btn.querySelector('span').innerText = 'Save';
            btn.querySelector('i').setAttribute('data-lucide', 'check');
            textarea.parentElement.classList.add('focus-ring');
        } else {
            textarea.setAttribute('readonly', 'true');
            btn.classList.remove('editing');
            btn.querySelector('span').innerText = 'Edit';
            btn.querySelector('i').setAttribute('data-lucide', 'edit-3');
            textarea.parentElement.classList.remove('focus-ring');
            
            // Save local modifications to the lead state
            if (state.currentLead) {
                state.currentLead.emailBody = textarea.value;
            }
            showToast('Email draft updated', 'info');
        }
        lucide.createIcons();
    }

    /**
     * Export leads list into downloadable RFC-4180 CSV
     */
    function exportLeadsToCsv() {
        if (state.leads.length === 0) {
            showToast('No leads available to export', 'error');
            return;
        }

        const headers = [
            'Company Name',
            'Website',
            'Niche/Description',
            'Contact Person',
            'Contact Job Title',
            'Contact Email',
            'Contact Phone',
            'Contact LinkedIn',
            'AI Fit Score (%)',
            'AI Score Reasoning',
            'Personalized Email Subject',
            'Personalized Email Body'
        ];

        // Format row cells with quotes and escapes
        const formatRow = (arr) => arr.map(val => {
            const escaped = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
            return `"${escaped}"`;
        }).join(',');

        let csvContent = '\uFEFF'; // UTF-8 BOM
        csvContent += formatRow(headers) + '\n';

        state.leads.forEach(lead => {
            const row = [
                lead.name,
                lead.website,
                lead.description,
                lead.contactName,
                lead.contactRole,
                lead.contactEmail,
                lead.contactPhone,
                lead.contactLinkedIn,
                lead.score,
                lead.scoreReasoning,
                lead.emailSubject,
                lead.emailBody
            ];
            csvContent += formatRow(row) + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Filename construction
        const cleanName = elements.industryInput.value.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'sales';
        link.setAttribute('href', url);
        link.setAttribute('download', `leadgen_${cleanName}_export.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV export downloaded!', 'success');
    }

    /**
     * Helper to classify leads
     */
    function getScoreTier(score) {
        if (score >= 85) return 'Hot';
        if (score >= 60) return 'Warm';
        return 'Cool';
    }

    /**
     * Check local key settings and update top status badge
     */
    function updateApiStatusUI() {
        const hasKey = state.apiKey && state.apiKey.trim().startsWith('gsk_');
        
        if (hasKey) {
            elements.apiStatusBadge.className = 'status-badge';
            elements.apiStatusBadge.querySelector('.status-text').innerText = 'Groq API Active';
            elements.apiStatusBadge.title = 'Ready to call Groq Cloud completions.';
        } else {
            elements.apiStatusBadge.className = 'status-badge simulation';
            elements.apiStatusBadge.querySelector('.status-text').innerText = 'Simulation Mode';
            elements.apiStatusBadge.title = 'Runs localized simulations. Open settings to configure API key.';
        }
    }

    /**
     * Display a sleek pop-up toast in the bottom right corner
     */
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconName = 'check-circle';
        if (type === 'error') iconName = 'alert-triangle';
        else if (type === 'info') iconName = 'info';

        toast.innerHTML = `
            <span class="toast-icon"><i data-lucide="${iconName}"></i></span>
            <span class="toast-message">${message}</span>
        `;
        
        elements.toastContainer.appendChild(toast);
        lucide.createIcons();

        // Animate removal after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (toast.parentNode === elements.toastContainer) {
                    elements.toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3200);
    }
});
