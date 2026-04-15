import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()

const provider = new ethers.JsonRpcProvider('https://testnet.hsk.xyz')
const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

const abi = ['function setKycLevel(address wallet, uint8 level) external']
const mockKyc = new ethers.Contract('0x5B163B75511C2A7967a6b1985A3420deD0ACca9D', abi, deployer)

const ADVANCED = '0xB0dE846CaaEb0e66A4303D1E1015619AfdDC09aB'
const ULTIMATE = '0x0D412380a6cd1938602Fd163FE90F2527001e87b'

const tx1 = await mockKyc.setKycLevel(ADVANCED, 2)
await tx1.wait()
console.log('ADVANCED set:', tx1.hash)

const tx2 = await mockKyc.setKycLevel(ULTIMATE, 4)
await tx2.wait()
console.log('ULTIMATE set:', tx2.hash)

console.log('\nImport these into Rabby/MetaMask for the demo:')
console.log('ADVANCED wallet:', ADVANCED)
console.log('ADVANCED key:   0x12d8b1cff643769f4754cf753026f3e1bdecc81775d77c703c089ae3094495a2')
console.log('ULTIMATE wallet:', ULTIMATE)
console.log('ULTIMATE key:   0x1adee8ab189b63cf5b56cb1135e4c93930d2f7039a5f9439abd53e66742b46d3')
