/**
 * Service Enquiry API Helper
 * Used by user-facing service pages to submit enquiries to the admin dashboard.
 */

import { API_BASE_URL } from './config';

const ENDPOINT = `${API_BASE_URL}/services/enquiry`;

export async function submitServiceEnquiry(payload) {
  const {
    serviceType, clientName, clientPhone, clientEmail, location, serviceName, notes,
    loanRequired, employmentType, monthlyIncome, cibilScore, preferredBank, propertyValue, propertySize, propertyRef,
    budgetRange, designStyle, packageSelected, scope,
    moveType, moveFrom, moveTo, bhkType, selectedMover, shiftingDate, packingQuality, insuranceRequired,
    legalServiceType, legalServiceScope, courtJurisdiction, consultationDate, source = 'web',
  } = payload;

  if (!serviceType || !clientName || !clientPhone) {
    throw new Error('serviceType, clientName and clientPhone are required.');
  }

  const body = {
    serviceType, clientName, clientPhone,
    source,
    ...(clientEmail && { clientEmail }),
    ...(location && { location }),
    ...(serviceName && { serviceName }),
    ...(notes && { notes }),
    ...(moveFrom && { moveFrom }),
    ...(moveTo && { moveTo }),
    ...(bhkType && { bhkType }),
    ...(selectedMover && { selectedMover }),
    ...(packageSelected && { packageSelected }),
    ...(legalServiceType && { legalServiceType }),
    ...(consultationDate && { consultationDate }),
    ...(loanRequired && { loanRequired }),
    ...(employmentType && { employmentType }),
    ...(monthlyIncome && { monthlyIncome }),
    ...(cibilScore && { cibilScore }),
    ...(preferredBank && { preferredBank }),
    ...(propertyValue && { propertyValue }),
    ...(propertySize && { propertySize: propertySize || bhkType }),
    ...(propertyRef && { propertyRef }),
    ...(budgetRange && { budgetRange }),
    ...(designStyle && { designStyle }),
    ...(Array.isArray(scope) && scope.length && { scope }),
    ...(moveType && { moveType }),
    ...(shiftingDate && { shiftingDate }),
    ...(packingQuality && { packingQuality }),
    ...(insuranceRequired && { insuranceRequired }),
    ...(legalServiceScope && { legalServiceScope }),
    ...(courtJurisdiction && { courtJurisdiction }),
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Submission failed (${res.status})`);
  return data.data;
}

export async function trackEnquiryStatus(refId) {
  if (!refId) throw new Error('Reference ID is required.');
  const res = await fetch(`${ENDPOINT}/${encodeURIComponent(refId.toUpperCase())}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Not found (${res.status})`);
  return data.data?.enquiry;
}

export const submitMoversEnquiry   = (p) => submitServiceEnquiry({ ...p, serviceType: 'Movers' });
export const submitLegalEnquiry    = (p) => submitServiceEnquiry({ ...p, serviceType: 'Legal' });
export const submitInteriorEnquiry = (p) => submitServiceEnquiry({ ...p, serviceType: 'Interior' });
export const submitLoanEnquiry     = (p) => submitServiceEnquiry({ ...p, serviceType: 'Loan' });
