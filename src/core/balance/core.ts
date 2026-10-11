// ค่าพื้นฐานเริ่มเกม + เด็คเริ่มต้น
import type { CardData } from '../types';
import { START_DECK as START_DECK_FROM_PACK } from '../pack';

export const START_HP = 50;
export const START_ENERGY = 3;
/**
 * ขนาดมือตั้งต้น
 *
 * เคยเป็น 3 ซึ่งเล็กเกินไปสำหรับสำรับ 13-17 ใบ — แต่ละเทิร์นเห็นสำรับแค่ราวๆ 20%
 * การเล่นจึงเป็นการรับไพ่ที่ถูกแจกมา ไม่ใช่การเลือก และคอมโบที่ต้องใช้การ์ด
 * สองสามใบพร้อมกันแทบเป็นไปไม่ได้เลย
 *
 * NotFM จั่ว "จนเต็มมือ" ทุกเทิร์นและมือใหญ่กว่านี้ชัดเจน — มือที่ใหญ่พอคือ
 * สิ่งที่ทำให้ระบบอื่น (คอมโบ การ์ดดัก) มีที่ยืน
 */
export const HAND_SIZE = 5;
export const START_GOLD = 80;

export const START_DECK: CardData[] = START_DECK_FROM_PACK;

// พลังงาน/ขนาดมือ/ขนาดเด็คศัตรู
export const ENEMY_HAND_SIZE = 3; // เพิ่มเป็น 3 ใบ
export const ENEMY_DECK_SIZE = 15; // เพิ่มขนาดเด็ค

export const ENEMY_MAX_ENERGY_NORMAL = 2;
export const ENEMY_MAX_ENERGY_ELITE  = 3;
export const ENEMY_MAX_ENERGY_BOSS   = 3;