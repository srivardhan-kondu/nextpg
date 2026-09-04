import * as React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles, palette, likelihoodColor, likelihoodBg } from './theme';
import { formatRank, formatRankRange } from '@/lib/utils';
import { CATEGORY_LABEL, COLLEGE_TYPE_LABEL, LIKELIHOOD_META, QUOTA_LABEL } from '@/lib/constants';
import type { ReportData } from '@/types/report';
import type { CollegeOpportunity } from '@/types/prediction';

/** Columns are laid out by flex weight so a long college name never overflows. */
const COL = { college: 3.1, branch: 1.7, quota: 0.8, rank: 1, chance: 0.9 } as const;

function Footer({ brand }: { brand: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{brand} — estimates only, verify on the official counseling portal.</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function SectionTitle({ children, caption }: { children: string; caption?: string }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{children}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvItem}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function OpportunityTable({ rows, emptyMessage }: { rows: CollegeOpportunity[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return <Text style={{ fontSize: 8.5, color: palette.muted }}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={styles.tr}>
        <Text style={[styles.th, { flex: COL.college }]}>College</Text>
        <Text style={[styles.th, { flex: COL.branch }]}>Branch</Text>
        <Text style={[styles.th, { flex: COL.quota }]}>Quota</Text>
        <Text style={[styles.th, { flex: COL.rank, textAlign: 'right' }]}>Closing</Text>
        <Text style={[styles.th, { flex: COL.chance, textAlign: 'right' }]}>Chance</Text>
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row.collegeId}-${row.branchId}-${row.quota}-${index}`}
          style={index === rows.length - 1 ? styles.trLast : styles.tr}
          wrap={false}
        >
          <View style={{ flex: COL.college, paddingVertical: 6, paddingHorizontal: 7 }}>
            <Text style={[styles.td, styles.tdStrong, { padding: 0 }]}>{row.collegeName}</Text>
            <Text style={{ fontSize: 7.5, color: palette.muted }}>
              {row.state} · {COLLEGE_TYPE_LABEL[row.collegeType]}
            </Text>
          </View>
          <Text style={[styles.td, { flex: COL.branch }]}>{row.branchName}</Text>
          <Text style={[styles.td, { flex: COL.quota }]}>{QUOTA_LABEL[row.quota]}</Text>
          <Text style={[styles.td, { flex: COL.rank, textAlign: 'right' }]}>{formatRank(row.closingRank)}</Text>
          <Text
            style={[
              styles.td,
              styles.tdStrong,
              { flex: COL.chance, textAlign: 'right', color: likelihoodColor[row.band] },
            ]}
          >
            {row.probability}%
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const { profile, exam, prediction } = data;

  return (
    <Document
      title={`${data.brand} PG Prediction Report — ${profile.candidateName}`}
      author={data.brand}
      subject="NEET PG rank, branch and college prediction report"
      creator={data.brand}
    >
      {/* ── Cover ── */}
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View style={styles.coverBand}>
          <Text style={styles.coverBrand}>{data.brand}</Text>
          <Text style={styles.coverTagline}>{data.tagline}</Text>
          <Text style={styles.coverTitle}>PG Prediction &amp; Counseling Report</Text>
        </View>

        <View style={styles.coverBody}>
          <Text style={styles.coverName}>{profile.candidateName}</Text>
          <Text style={styles.coverMeta}>
            {profile.state} · {CATEGORY_LABEL[profile.category]}
            {profile.subCategory !== 'NONE' ? ` (${profile.subCategory.replace('_', ' ')})` : ''} · NEET PG {exam.examYear}
          </Text>

          <View style={styles.headline}>
            <Text style={styles.headlineLabel}>Estimated All India Rank</Text>
            <Text style={styles.headlineValue}>{formatRankRange(prediction.rankMin, prediction.rankMax)}</Text>
            <Text style={styles.headlineHint}>
              Confidence {prediction.confidence}% · Expected score {exam.expectedScore}/800 · Percentile{' '}
              {prediction.percentile.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.statRow, { marginTop: 16 }]}>
            <Stat label="AIQ options" value={String(prediction.aiqOpportunities)} />
            <Stat label="State quota options" value={String(prediction.stateOpportunities)} />
            <Stat label="Total options" value={String(prediction.totalOpportunities)} />
          </View>

          <View style={styles.disclaimer}>
            <Text>{data.disclaimer}</Text>
            <Text style={{ marginTop: 5 }}>
              Report {data.reportId} · Generated {data.generatedAt}
            </Text>
          </View>
        </View>

        <Footer brand={data.brand} />
      </Page>

      {/* ── Profile + rank analysis ── */}
      <Page size="A4" style={styles.page}>
        <View>
          <SectionTitle>1. Profile Summary</SectionTitle>
          <View style={styles.kvGrid}>
            <Kv label="Candidate" value={profile.candidateName} />
            <Kv label="Gender" value={profile.gender.charAt(0) + profile.gender.slice(1).toLowerCase()} />
            <Kv label="Domicile state" value={profile.state} />
            <Kv label="Category" value={CATEGORY_LABEL[profile.category]} />
            <Kv label="Sub category" value={profile.subCategory === 'NONE' ? 'None' : profile.subCategory.replace('_', ' ')} />
            <Kv label="College preference" value={profile.preferredType === 'ANY' ? 'Any' : COLLEGE_TYPE_LABEL[profile.preferredType]} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>2. Prediction Summary</SectionTitle>
          <View style={styles.statRow}>
            <Stat label="Correct" value={String(exam.correctAnswers)} />
            <Stat label="Wrong" value={String(exam.wrongAnswers)} />
            <Stat label="Unattempted" value={String(exam.unattempted)} />
            <Stat label="Expected score" value={`${exam.expectedScore}/800`} />
          </View>
          <View style={styles.statRow}>
            <Stat label="Estimated rank" value={formatRankRange(prediction.rankMin, prediction.rankMax)} />
            <Stat label="Confidence" value={`${prediction.confidence}%`} />
            <Stat label="Percentile" value={prediction.percentile.toFixed(2)} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle caption="How this range was derived and what it means for your counseling plan.">
            3. Estimated Rank Analysis
          </SectionTitle>
          <Text style={styles.paragraph}>
            Your expected score of {exam.expectedScore} maps to an all-India rank of roughly{' '}
            {formatRankRange(prediction.rankMin, prediction.rankMax)}. The range — not a single number — is the
            honest output: the exact rank depends on how the whole cohort performs, the final answer key, and
            normalisation, none of which are known before results.
          </Text>
          <Text style={styles.paragraph}>
            Plan against the <Text style={styles.tdStrong}>upper bound ({formatRank(prediction.rankMax)})</Text>. If
            your actual rank lands better than that, every option in this report stays open. If you plan against the
            lower bound instead, a small slip can leave you without a seat.
          </Text>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>Confidence: {prediction.confidence}%</Text>
            <Text style={{ fontSize: 8.5 }}>
              Confidence reflects how much verified cutoff data supports this estimate for your category and state,
              plus how plausible your attempt profile is. It is never 100% — this is a projection, not a result.
            </Text>
          </View>
        </View>

        <Footer brand={data.brand} />
      </Page>

      {/* ── AIQ + state opportunities ── */}
      <Page size="A4" style={styles.page}>
        <View>
          <SectionTitle caption="50% of government PG seats, open to all states. No domicile needed.">
            4. AIQ Opportunities
          </SectionTitle>
          <OpportunityTable
            rows={data.aiqOpportunities}
            emptyMessage="No All India Quota seats matched your estimated rank in our records for this category."
          />
        </View>

        <View style={styles.section} break={data.aiqOpportunities.length > 14}>
          <SectionTitle caption={`Seats reserved for ${profile.state} domicile holders, plus deemed and private options.`}>
            5. State Quota Opportunities
          </SectionTitle>
          <OpportunityTable
            rows={data.stateOpportunities}
            emptyMessage={`No state quota seats matched your estimated rank in ${profile.state} for this category.`}
          />
        </View>

        <Footer brand={data.brand} />
      </Page>

      {/* ── Dream validation ── */}
      <Page size="A4" style={styles.page}>
        <View>
          <SectionTitle caption="Your stated ambitions, tested against the same historical cutoffs.">
            6. Dream Branch &amp; College Validation
          </SectionTitle>

          {data.dreamValidations.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: palette.muted }}>
              No dream branch or college was validated for this prediction. Run the Dream Validator to add this
              section to a future report.
            </Text>
          ) : (
            data.dreamValidations.map((dream, index) => (
              <View key={index} style={{ marginBottom: 15 }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: palette.ink }}>
                    {dream.dreamBranch}
                  </Text>
                  <Text
                    style={[
                      styles.pill,
                      {
                        color: likelihoodColor[dream.branchLikelihood],
                        backgroundColor: likelihoodBg[dream.branchLikelihood],
                      },
                    ]}
                  >
                    {LIKELIHOOD_META[dream.branchLikelihood].label} · {dream.branchProbability}%
                  </Text>
                </View>
                <Text style={{ fontSize: 8.5, marginBottom: 8 }}>{dream.branchMessage}</Text>

                {dream.dreamCollege ? (
                  <View style={styles.callout}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <Text style={styles.calloutTitle}>{dream.dreamCollege}</Text>
                      {dream.collegeLikelihood ? (
                        <Text
                          style={[
                            styles.pill,
                            {
                              color: likelihoodColor[dream.collegeLikelihood],
                              backgroundColor: likelihoodBg[dream.collegeLikelihood],
                            },
                          ]}
                        >
                          {LIKELIHOOD_META[dream.collegeLikelihood].label}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ fontSize: 8.5, marginBottom: 5 }}>{dream.collegeMessage}</Text>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                      <View>
                        <Text style={styles.kvLabel}>Required rank</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: palette.ink }}>
                          {dream.requiredRankMin != null && dream.requiredRankMax != null
                            ? formatRankRange(dream.requiredRankMin, dream.requiredRankMax)
                            : 'No data'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.kvLabel}>Your rank</Text>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: palette.ink }}>
                          {formatRankRange(prediction.rankMin, prediction.rankMax)}
                        </Text>
                      </View>
                    </View>
                    {dream.eligibleQuotas.length > 0 ? (
                      <Text style={{ fontSize: 8, color: palette.muted, marginTop: 5 }}>
                        Eligible quotas: {dream.eligibleQuotas.join(', ')}
                      </Text>
                    ) : null}
                    {dream.availableBranches.length > 0 ? (
                      <Text style={{ fontSize: 8, color: palette.muted, marginTop: 2 }}>
                        Branches on record: {dream.availableBranches.slice(0, 12).join(', ')}
                        {dream.availableBranches.length > 12 ? ` +${dream.availableBranches.length - 12} more` : ''}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle caption="Ranked by how reachable they are at your estimated rank.">
            7. Recommended Branches
          </SectionTitle>
          {data.recommendedBranches.length === 0 ? (
            <Text style={{ fontSize: 8.5, color: palette.muted }}>No branch recommendations available.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, { flex: 2 }]}>Branch</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Likelihood</Text>
                <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Seats</Text>
                <Text style={[styles.th, { flex: 3 }]}>Why</Text>
              </View>
              {data.recommendedBranches.map((branch, index) => (
                <View
                  key={branch.branchName}
                  style={index === data.recommendedBranches.length - 1 ? styles.trLast : styles.tr}
                  wrap={false}
                >
                  <Text style={[styles.td, styles.tdStrong, { flex: 2 }]}>{branch.branchName}</Text>
                  <Text style={[styles.td, { flex: 1.3, color: likelihoodColor[branch.likelihood] }]}>
                    {LIKELIHOOD_META[branch.likelihood].label} · {branch.probability}%
                  </Text>
                  <Text style={[styles.td, { flex: 0.8, textAlign: 'right' }]}>{branch.seatsInRange}</Text>
                  <Text style={[styles.td, { flex: 3, fontSize: 7.5 }]}>{branch.rationale}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Footer brand={data.brand} />
      </Page>

      {/* ── Colleges + strategy ── */}
      <Page size="A4" style={styles.page}>
        <View>
          <SectionTitle caption="Your strongest realistic seats, best options first.">
            8. Recommended Colleges
          </SectionTitle>
          <OpportunityTable
            rows={data.recommendedColleges}
            emptyMessage="No college recommendations matched your filters. Widening your college type preference usually surfaces more."
          />
        </View>

        <View style={styles.section}>
          <SectionTitle>9. Counseling Strategy</SectionTitle>
          {data.strategy.map((note, index) => (
            <View key={index} style={styles.callout} wrap={false}>
              <Text style={styles.calloutTitle}>{note.title}</Text>
              <Text style={{ fontSize: 8.5 }}>{note.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle>10. Important Notes</SectionTitle>
          {data.notes.map((note, index) => (
            <View key={index} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{note}</Text>
            </View>
          ))}
          <View style={styles.disclaimer}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 3, color: palette.body }}>Disclaimer</Text>
            <Text>{data.disclaimer}</Text>
            <Text style={{ marginTop: 5 }}>
              {data.brand} is an independent planning tool. It is not affiliated with the NBEMS, MCC, or any state
              counseling authority. Always confirm seat matrices, cutoffs, fees and eligibility on the official
              counseling portal before locking a choice.
            </Text>
          </View>
        </View>

        <Footer brand={data.brand} />
      </Page>
    </Document>
  );
}
