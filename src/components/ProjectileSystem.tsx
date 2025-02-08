import React, {  } from 'react'
import { HitEffects } from './HitEffects';
import EnemyNormalProjectile from './EnemyNormalProjectile';
import EnemyUnbrokenProjectile from './EnemyUnbrokenProjectile';
import { EnemyExplosionEffects } from './EnemyExplosionParticle';
import { EnemySpawnEffect } from './EnemySpawnEffect';
import { HitExplosionParticleEffects } from './HitExplosionParticle';
import { HitWhiteMaskEffects } from './HitWhiteMaskEffects';
import { PlayerOnHitLightningEffect } from './PlayerOnHitEffects';
import { PlayerDeathEffect } from './PlayerDeathEffect';
import PlayerProjectile from './PlayerProjectile';

export const ProjectileSystem = () => {
    return (
        <>
            <PlayerProjectile />
            <HitEffects />
            <HitExplosionParticleEffects />
            <EnemyNormalProjectile />
            <EnemyUnbrokenProjectile />
            <EnemySpawnEffect />
            <EnemyExplosionEffects />
            <HitWhiteMaskEffects />
            <PlayerOnHitLightningEffect />
            <PlayerDeathEffect />
        </>
    );
}
