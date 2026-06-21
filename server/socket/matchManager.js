const FALLBACK_WAIT_SECONDS = 30;

class MatchManager {
  constructor() {
    // userObj shape:
    // { socketId, userId, username, profilePic, interests, gender, country, language,
    //   isPremium, isGuest, filters: { interests: bool, language, country, gender }, joinedAt }
    this.queue = [];
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  // Add user to queue; returns match result or null
  addToQueue(userObj) {
    this.removeFromQueue(userObj.socketId);

    // Record queue entry time for the 30s fallback
    userObj.joinedAt = Date.now();

    const matchIndex = this.findMatch(userObj);
    if (matchIndex !== -1) {
      const peer = this.queue.splice(matchIndex, 1)[0];
      return { user1: userObj, user2: peer };
    }

    this.queue.push(userObj);
    return null;
  }

  // Remove a specific user (disconnect / skip / leave-queue)
  removeFromQueue(socketId) {
    const index = this.queue.findIndex(u => u.socketId === socketId);
    if (index !== -1) {
      return this.queue.splice(index, 1)[0];
    }
    return null;
  }

  // Returns users that have been waiting longer than the fallback threshold
  getExpiredUsers(thresholdSeconds = FALLBACK_WAIT_SECONDS) {
    const now = Date.now();
    return this.queue.filter(u => (now - (u.joinedAt || now)) / 1000 > thresholdSeconds);
  }

  getQueueSize() {
    return this.queue.length;
  }

  // ─── Compatibility Checks ────────────────────────────────────────────────────

  /**
   * Mutual, bidirectional gender compatibility check.
   *
   * Rules:
   *  - Only premium users can enforce a gender preference.
   *  - If a user has been waiting > FALLBACK_WAIT_SECONDS their preference is
   *    treated as 'unspecified' for THIS check (they become a wildcard).
   *  - Both sides must be satisfied for a match.
   *
   * @param {object} a – queue user object
   * @param {object} b – queue user object
   * @returns {boolean}
   */
  isGenderCompatible(a, b) {
    const now = Date.now();
    const aWaitedSec = (now - (a.joinedAt || now)) / 1000;
    const bWaitedSec = (now - (b.joinedAt || now)) / 1000;

    // Effective preference: premium + preference set + not yet expired
    const aPref = (a.isPremium && a.filters?.gender && a.filters.gender !== 'unspecified' && aWaitedSec < FALLBACK_WAIT_SECONDS)
      ? a.filters.gender
      : 'unspecified';

    const bPref = (b.isPremium && b.filters?.gender && b.filters.gender !== 'unspecified' && bWaitedSec < FALLBACK_WAIT_SECONDS)
      ? b.filters.gender
      : 'unspecified';

    const aGender = a.gender || 'unspecified';
    const bGender = b.gender || 'unspecified';

    // A is satisfied: wants anyone, OR b's gender is what A wants
    const aSatisfied = aPref === 'unspecified' || bGender === aPref;
    // B is satisfied: wants anyone, OR a's gender is what B wants
    const bSatisfied = bPref === 'unspecified' || aGender === bPref;

    return aSatisfied && bSatisfied;
  }

  /**
   * Full compatibility check (gender + filters).
   * Evaluated from user's perspective against peer.
   */
  isCompatible(user, peer) {
    // 1. Mutual gender check (always applied)
    if (!this.isGenderCompatible(user, peer)) return false;

    const filters = user.filters || {};

    // 2. Language filter
    if (filters.language && filters.language !== 'Global') {
      if (peer.language !== filters.language) return false;
    }

    // 3. Country filter
    if (filters.country && filters.country !== 'Global') {
      if (peer.country !== filters.country) return false;
    }

    // 4. Interest filter (opt-in, both must have interests)
    if (filters.interests && user.interests?.length > 0) {
      const peerInterestsLower = (peer.interests || []).map(i => i.toLowerCase());
      const hasShared = user.interests.some(i => peerInterestsLower.includes(i.toLowerCase()));
      if (!hasShared) return false;
    }

    return true;
  }

  // ─── Matching Engine ─────────────────────────────────────────────────────────

  findMatch(user) {
    const R = Math.floor(Math.random() * 100);
    let strategies;

    if (R < 50) {
      strategies = ['interests', 'language', 'country', 'random'];
    } else if (R < 75) {
      strategies = ['language', 'interests', 'country', 'random'];
    } else if (R < 90) {
      strategies = ['country', 'interests', 'language', 'random'];
    } else {
      strategies = ['random', 'interests', 'language', 'country'];
    }

    console.log(`[Queue Matcher] Rolling strategy: ${strategies[0]} for user: ${user.username} (Roll: ${R})`);

    for (const strategy of strategies) {
      const idx = this.findMatchByStrategy(user, strategy);
      if (idx !== -1) return idx;
    }

    return -1;
  }

  findMatchByStrategy(user, strategy) {
    for (let i = 0; i < this.queue.length; i++) {
      const peer = this.queue[i];

      // Never match same account across multiple tabs
      if (user.userId === peer.userId) continue;

      // Gender compatibility is ALWAYS checked first (fastest rejection)
      if (!this.isGenderCompatible(user, peer)) continue;

      switch (strategy) {
        case 'interests': {
          if (user.interests?.length > 0 && peer.interests?.length > 0) {
            const peerLower = peer.interests.map(t => t.toLowerCase());
            const shared = user.interests.filter(t => peerLower.includes(t.toLowerCase()));
            if (shared.length > 0 && this.isCompatible(user, peer)) return i;
          }
          break;
        }
        case 'language': {
          if (user.language && user.language === peer.language && this.isCompatible(user, peer)) {
            return i;
          }
          break;
        }
        case 'country': {
          if (user.country && user.country === peer.country && this.isCompatible(user, peer)) {
            return i;
          }
          break;
        }
        case 'random': {
          // Accept any peer that passes full compatibility (gender + active filters)
          if (this.isCompatible(user, peer)) return i;
          break;
        }
      }
    }
    return -1;
  }
}

module.exports = new MatchManager();
