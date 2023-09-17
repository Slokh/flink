import { Channel } from "./types";

export const CHANNELS = [
  {
    name: "/dev",
    parentUrl:
      "chain://eip155:1/erc721:0x7dd4e31f1530ac682c8ea4d8016e95773e08d8b0",
    image:
      "https://i.seadn.io/gcs/files/b110857d29c31ab3a379ab50e2fdcf54.png?auto=format&dpr=1&w=512",
    channelId: "farcaster-dev",
  },
  {
    name: "AI",
    parentUrl:
      "chain://eip155:7777777/erc721:0x5747eef366fd36684e8893bf4fe628efc2ac2d10",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeidaofd6olol55alhr2npgfiocv6oxdbjcyvpssh6hgr5v6pqwhxrm",
    channelId: "ai",
  },
  {
    name: "Art",
    parentUrl:
      "chain://eip155:1/erc721:0x1538c5ddbb073638b7cd1ae41ec2d9f9a4c24a7e",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreibrpwjcp2tykkzanqgrzaofxfsf2or7xvhb37wpzg6miazloph6fi",
    channelId: "art",
  },
  {
    name: "Backend",
    parentUrl:
      "chain://eip155:7777777/erc721:0x9d9f2365dc761dbcdc9af8120472c5e88c90833c",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreifpkt3bpfyzuyolm5msnm7kee4ftbb6ixymu2rfoddd24tgxkfvpu",
    channelId: "backend",
  },
  {
    name: "Bitcoin",
    parentUrl: "https://bitcoin.org",
    image: "https://warpcast.com/~/channel-images/bitcoin.png",
    channelId: "bitcoin",
  },
  {
    name: "Books",
    parentUrl:
      "chain://eip155:1/erc721:0xc18f6a34019f5ba0fc5bc8cb6fe52e898d6bbbee",
    image:
      "https://i.seadn.io/gcs/files/1b3612720761923ac32e276a29a0a234.png?auto=format&dpr=1&w=512",
    channelId: "books",
  },
  {
    name: "Builder",
    parentUrl:
      "chain://eip155:1/erc721:0xdf9b7d26c8fc806b1ae6273684556761ff02d422",
    image:
      "https://i.seadn.io/gae/emh3ta_T35Zqa9taIH4FW-xoIjLOVz_HfJfCyXWlwc2714nRn0UfJxaV9lQBVpSXj-rOnba_arbMYufP0tT8triR8FgwzALfnmBrRA?w=500&auto=format",
    channelId: "builder",
  },
  {
    name: "Cabin",
    parentUrl: "https://cabin.city",
    image: "https://warpcast.com/~/channel-images/cabin.png",
    channelId: "cabin-city",
  },
  {
    name: "Cats",
    parentUrl:
      "chain://eip155:7777777/erc721:0x038adac316a87c29c3acc8641e1d8320bb0144c2",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeiex4iylhyfsihrqxs6hpvy6ik5i5m2pbihdhtcj2eov6uqdncoezy",
    channelId: "cats",
  },
  {
    name: "Chess",
    parentUrl:
      "chain://eip155:7777777/erc721:0xca3e25b5c41b02ffa6f3b053426e96b59b64a9ae",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeih5vyspqun36vv7ai3yxc54yuhfa6p577okwwhhvd2gcsy53pksym",
    channelId: "chess",
  },
  {
    name: "Degen",
    parentUrl:
      "chain://eip155:7777777/erc721:0x5d6a07d07354f8793d1ca06280c4adf04767ad7e",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreieudzvadtjy36j7x2i73isqw2jmgbwtum3p3eaahn4mnztuzl7y7e",
    channelId: "degen",
  },
  {
    name: "Design",
    parentUrl:
      "chain://eip155:7777777/erc721:0x22be981fb87effbe6780b34a6fe1dfc14a00ec8e",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeiclumzieza3g5qljprmixrvh4reqvmle6o3cpp5murltndpjjl2hu",
    channelId: "design",
  },
  {
    name: "Dogs",
    parentUrl:
      "chain://eip155:7777777/erc721:0x8cb43a65b27461b61d6c8989e6f9d88e5426833d",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeidvhfu3thunzfd3wj3ar6e6vlztnoljvqh2yauxwyfbh2vt65nypq",
    channelId: "dogs",
  },
  {
    name: "e/acc",
    parentUrl:
      "chain://eip155:7777777/erc721:0xc2a1570703480b72091283decb80292c273db559",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeifo72qxybndxv26rebjkojcx37pgkcwvvoz5h4liyx4appdxmyto4",
    channelId: "eff-acc",
  },
  {
    name: "e/m",
    parentUrl:
      "chain://eip155:1/erc721:0x05acde54e82e7e38ec12c5b5b4b1fd1c8d32658d",
    image:
      "https://i.seadn.io/gcs/files/92b324400baa286b6b4791b0371ad83e.png?auto=format&dpr=1&w=256",
    channelId: "electronic",
  },
  {
    name: "EthCC",
    parentUrl:
      "chain://eip155:1/erc721:0x39d89b649ffa044383333d297e325d42d31329b2",
    image:
      "https://i.seadn.io/gcs/files/b4dd8ef3c205737a672a167b57662acc.png?auto=format&dpr=1&w=512",
    channelId: "ethcc",
  },
  {
    name: "Ethereum",
    parentUrl: "https://ethereum.org",
    image: "https://warpcast.com/~/channel-images/ethereum.png",
    channelId: "ethereum",
  },
  {
    name: "ETHG NY",
    parentUrl: "https://ethglobal.com/events/newyork2023",
    image: "https://warpcast.com/~/channel-images/ethg-ny.png",
    channelId: "ethg-ny",
  },
  {
    name: "Events",
    parentUrl:
      "chain://eip155:1/erc721:0x7ea3dff0fcd9a203f594c7474f7c6bd098af0427",
    image:
      "https://i.seadn.io/gcs/files/79843c6a17f589934e651ffc811cc756.png?auto=format&dpr=1&w=512",
    channelId: "event-pass",
  },
  {
    name: "EVM",
    parentUrl:
      "chain://eip155:1/erc721:0x37fb80ef28008704288087831464058a4a3940ae",
    image: "https://warpcast.com/~/channel-images/evm.png",
    channelId: "evm",
  },
  {
    name: "F1",
    parentUrl:
      "chain://eip155:7777777/erc721:0x47163feb5c3b97f90671b1e1a1359b8240edbdbe",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeigabvfjslrhm3odwhp2o6ws2nm65groagcy6y2jldwx6gbxierhre",
    channelId: "f1",
  },
  {
    name: "Farcaster",
    parentUrl:
      "chain://eip155:7777777/erc721:0x4f86113fc3e9783cf3ec9a552cbb566716a57628",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreialf5usxssf2eu3e5ct37zzdd553d7lg7oywvdszmrg5p2zpkta7u",
    channelId: "farcaster",
  },
  {
    name: "FarCon",
    parentUrl:
      "chain://eip155:1/erc721:0x2A9EA02E4c2dcd56Ba20628Fe1bd46bAe2C62746",
    image:
      "https://i.seadn.io/gcs/files/fe246445104ccfc298417e5e5fc49505.jpg?w=500&auto=format",
    channelId: "farcon",
  },
  {
    name: "FarQuest",
    parentUrl:
      "chain://eip155:1/erc721:0x427b8efee2d6453bb1c59849f164c867e4b2b376",
    image: "https://warpcast.com/~/channel-images/farquest.png",
    channelId: "farquest",
  },
  {
    name: "Fashion",
    parentUrl:
      "chain://eip155:7777777/erc721:0x73a2bba481d2b4ec00ecbce45f580aabad14ae26",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeic65zgff3gsnh2vrtaxwimxvxa2u35h3rupxdns7u5rajq4suyhba",
    channelId: "fashion",
  },
  {
    name: "Fitness",
    parentUrl:
      "chain://eip155:1/erc721:0xee442da02f2cdcbc0140162490a068c1da94b929",
    image:
      "https://i.seadn.io/gcs/files/f89aa7f1b59bea83d838680cf567a0b1.png?auto=format&dpr=1&w=512",
    channelId: "fitness",
  },
  {
    name: "Food",
    parentUrl:
      "chain://eip155:1/erc721:0xec0ba367a6edf483a252c3b093f012b9b1da8b3f",
    image:
      "https://i.seadn.io/gcs/files/0d84654921fd65e3c1723bc74d976a07.png?auto=format&dpr=1&w=512",
    channelId: "food",
  },
  {
    name: "Frontend",
    parentUrl:
      "chain://eip155:7777777/erc721:0x3d037b11c5359fac54c3928dfad0b9512695d392",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreibv27igqil44vdeohccdmjdnrpoj6e4xsq6zlmp2is3vscoyau6yq",
    channelId: "frontend",
  },
  {
    name: "FWB Fest",
    parentUrl: "https://fest.fwb.help",
    image: "https://warpcast.com/~/channel-images/fwb-fest.png",
    channelId: "fwb-fest",
  },
  {
    name: "Gaming",
    parentUrl:
      "chain://eip155:7777777/erc721:0xa390bc5b492f4d378ca2ef513a45a89d54538f02",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeicej2ef7467g642ccwj3d56ctdyn33qda2zkuorbejftaed3wfube",
    channelId: "gaming",
  },
  {
    name: "GM",
    parentUrl:
      "chain://eip155:7777777/erc721:0x5556efe18d87f132054fbd4ba9afc13ebb1b0594",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreic5vdt7fm3wgrpmravsuvd3grpot6vztcrmwobb67suieszpl7qay",
    channelId: "gm",
  },
  {
    name: "History",
    parentUrl:
      "chain://eip155:7777777/erc721:0x177aa0bf214af03499c1fe239de20f3c4c373250",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeig7ib3vxqwjhmr5po54tdcpxuzbqkzrs3bmuam5bsyhsxxj4w2xxe",
    channelId: "history",
  },
  {
    name: "Kiwi News",
    parentUrl:
      "chain://eip155:1/erc721:0xebb15487787cbf8ae2ffe1a6cca5a50e63003786",
    image:
      "https://i.seadn.io/gcs/files/0b7457dd591cf6ac298d4bd62a68cdd4.png?auto=format&dpr=1&w=512",
    channelId: "kiwi-news",
  },
  {
    name: "LA",
    parentUrl:
      "chain://eip155:1/erc721:0x750262ee8b4261e061026fc24bb640a4aa88154a",
    image:
      "https://i.seadn.io/gcs/files/fba3bf4bd772c2fa7e4210978dbd07e8.png?auto=format&dpr=1&w=512",
    channelId: "los-angeles",
  },
  {
    name: "Launchcaster",
    parentUrl:
      "chain://eip155:1/erc721:0x5f4336f57cf41821522f1777321462b108de55c26",
    image:
      "https://i.seadn.io/gcs/files/8ac77581565e219f568849cdce1c0919.png?auto=format&dpr=1&w=512",
    channelId: "launchcaster",
  },
  {
    name: "MangAnime",
    parentUrl:
      "chain://eip155:7777777/erc721:0x5a5ddb8a2d1ee3d8e9fd59785da88d573d1a84fe",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeifkqmk7up6ho5zl5cpzws2fug7af2ninrhlomhw6ntcfhmy6nksvi",
    channelId: "manga-anime",
  },
  {
    name: "Memes",
    parentUrl:
      "chain://eip155:1/erc721:0xfd8427165df67df6d7fd689ae67c8ebf56d9ca61",
    image:
      "https://i.seadn.io/gcs/files/1f4acfc1e6831eb38e9453ce34ac79f8.png?auto=format&dpr=1&w=512",
    channelId: "memes",
  },
  {
    name: "MJ",
    parentUrl: "https://midjourney.com",
    image: "https://warpcast.com/~/channel-images/midjourney.png",
    channelId: "midjourney",
  },
  {
    name: "Music",
    parentUrl:
      "chain://eip155:7777777/erc721:0xe96c21b136a477a6a97332694f0caae9fbb05634",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeibdk7mvrhmud76ye6wm623sjgtiashik2imee7dkeliiq4wfissqq",
    channelId: "music",
  },
  {
    name: "NBA",
    parentUrl: "https://www.nba.com",
    image: "https://warpcast.com/~/channel-images/nba.png",
    channelId: "nba",
  },
  {
    name: "News",
    parentUrl:
      "chain://eip155:7777777/erc721:0x3cf3d6a6bcac3c60f3bb59fdd641b042102bb488",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeidpy6o32lbye6253lk67pdao4vbfazojqclkrlctukykppii2rs4e",
    channelId: "news",
  },
  {
    name: "Neynar",
    parentUrl:
      "chain://eip155:1/erc721:0xd4498134211baad5846ce70ce04e7c4da78931cc",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeidupusfn5udq2sclotztyavhtopmwttymh4fzapnjwfwx5b3jh42u",
    channelId: "neynar",
  },
  {
    name: "NFL",
    parentUrl: "https://www.nfl.com",
    image: "https://warpcast.com/~/channel-images/nfl.png",
    channelId: "nfl",
  },
  {
    name: "Nouns",
    parentUrl:
      "chain://eip155:1/erc721:0x9c8ff314c9bc7f6e59a9d9225fb22946427edc03",
    image:
      "https://i.seadn.io/gae/vfYB4RarIqixy2-wyfP4lIdK6fsOT8uNrmKxvYCJdjdRwAMj2ZjC2zTSxL-YKky0s-4Pb6eML7ze3Ouj54HrpUlfSWx52xF_ZK2TYw?w=500&auto=format",
    channelId: "nouns",
  },
  {
    name: "NY",
    parentUrl:
      "chain://eip155:1/erc721:0xfdd5e7949bd72c95907c46a630d2c791f0e842c6",
    image:
      "https://i.seadn.io/gcs/files/48399e13b30e401d90c3c61a0065e02a.png?auto=format&dpr=1&w=512",
    channelId: "new-york",
  },
  {
    name: "OP Stack",
    parentUrl: "https://www.optimism.io",
    image: "https://warpcast.com/~/channel-images/op-stack.png",
    channelId: "op-stack",
  },
  {
    name: "Orange",
    parentUrl: "https://www.orangedao.xyz",
    image: "https://warpcast.com/~/channel-images/orange.png",
    channelId: "orange-dao",
  },
  {
    name: "Parenting",
    parentUrl:
      "chain://eip155:8453/erc721:0xb7310fc4b4a31c4fb7adf90b8201546bb2bcb52c",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeifl46eltwvlwof5fsusgk5vk4rq7duo4qw33xq4gbdjsq4a4kbcom",
    channelId: "parenting",
  },
  {
    name: "Philosophy",
    parentUrl:
      "chain://eip155:7777777/erc721:0xc48c325f794f9105000aa27d427fbed363fa7112",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeicrwbexnu5eaanubd7sw4vslzvsev6yqls6flbncfakqi3cawjet4",
    channelId: "philosophy",
  },
  {
    name: "Photography",
    parentUrl:
      "chain://eip155:7777777/erc721:0x36ef4ed7a949ee87d5d2983f634ae87e304a9ea2",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeifezoeekksio4ojy6xcm6x4b3ety2dbkly5d5d4a7kwsc5skixgye",
    channelId: "photography",
  },
  {
    name: "Podcasts",
    parentUrl:
      "chain://eip155:1/erc721:0xdf3abf79aedcc085e9a41a569964e9fb53f33728",
    image:
      "https://i.seadn.io/gcs/files/2c3368e27d86aac05da2ff57b5dd80b8.png?auto=format&dpr=1&w=512",
    channelId: "podcasts",
  },
  {
    name: "Purple",
    parentUrl:
      "chain://eip155:1/erc721:0xa45662638e9f3bbb7a6fecb4b17853b7ba0f3a60",
    image:
      "https://i.seadn.io/gae/2R29pIWneHAMHH0e2Lcqsilv7vRBpnYngrKOZXBkhpyrlBVgcJzgPxPq_pWujLggzy-EW1Jt9QJIOQW7t95ufdgvwCAITd4fw0DvQJM?w=500&auto=format",
    channelId: "purple",
  },
  {
    name: "Purpler",
    parentUrl:
      "chain://eip155:1/erc721:0x8edceb20795ac2b93ab8635af77e96cae123d045",
    image:
      "https://i.seadn.io/gcs/files/ee90b81a2aef63af2e763bd5718f07a1.png?w=500&auto=format",
    channelId: "purpler",
  },
  {
    name: "Quilibrium",
    parentUrl: "https://www.quilibrium.com",
    image: "https://warpcast.com/~/channel-images/quilibrium.png",
    channelId: "quilibrium",
  },
  {
    name: "Rust",
    parentUrl: "https://www.rust-lang.org",
    image: "https://warpcast.com/~/channel-images/rust.png",
    channelId: "rust",
  },
  {
    name: "SBC",
    parentUrl: "https://cbr.stanford.edu/sbc23/",
    image: "https://warpcast.com/~/channel-images/sbc.png",
    channelId: "sbc",
  },
  {
    name: "Science",
    parentUrl:
      "chain://eip155:8453/erc721:0xd953664a9b9e30fa7b3ccd00a2f9c21c7b75c5f0",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeicwk3vf7oilmigaraj6sfnylb5upits56usthxrndnehb2gf4vty4",
    channelId: "science",
  },
  {
    name: "Screens",
    parentUrl:
      "chain://eip155:1/erc721:0xc4934dbb7a71f76e4068cd04fade20ad6c0023dd",
    image:
      "https://i.seadn.io/gcs/files/6a1b1587b246576cc87309031f781bea.png?auto=format&dpr=1&w=512",
    channelId: "screens",
  },
  {
    name: "SF",
    parentUrl:
      "chain://eip155:7777777/erc721:0x2df74b933d530c66679e6fcc4c9396ebb230ccb2",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeieh736ikqpzha4nd6st6zbztsuyn4owskcdyxyt7xjerf6vdvqssm",
    channelId: "sf",
  },
  {
    name: "Soccer",
    parentUrl:
      "chain://eip155:1/erc721:0x7abfe142031532e1ad0e46f971cc0ef7cf4b98b0",
    image:
      "https://i.seadn.io/gcs/files/d1a1532c0b6e27f674dcaaba1e7a0d58.png?auto=format&dpr=1&w=512",
    channelId: "soccer",
  },
  {
    name: "Solana",
    parentUrl: "https://solana.com",
    image: "https://warpcast.com/~/channel-images/solana.png",
    channelId: "solana",
  },
  {
    name: "Space",
    parentUrl:
      "chain://eip155:7777777/erc721:0x31fa484c7df6e0f04f520c97a7552d72123c1bc1",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeigvmchkzxtw23d5isyhcn3oj4sojnlp7hpl6rspce7chb3gfdnswm",
    channelId: "space",
  },
  {
    name: "Surveycaster",
    parentUrl:
      "chain://eip155:1/erc721:0xb58f8b1972c86aacd58f86ffae37ed31664c934d",
    image:
      "https://i.seadn.io/gcs/files/b6affa5205c571cf3421d49ad7d778ba.png?auto=format&dpr=1&w=512",
    channelId: "surveycaster",
  },
  {
    name: "Tabletop",
    parentUrl:
      "chain://eip155:7777777/erc721:0xf7ebaea271e84a0c40e90bc6f5889dbfa0a12366",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeideqszuilofnqj6xyphlbiy75i32uunfwuj3bzedv7wfst25fh46a",
    channelId: "tabletop",
  },
  {
    name: "Tezos",
    parentUrl: "https://tezos.com",
    image: "https://warpcast.com/~/channel-images/tezos.png",
    channelId: "tezos",
  },
  {
    name: "Travel",
    parentUrl:
      "chain://eip155:7777777/erc721:0x917ef0a90d63030e6aa37d51d7e6ece440ace537",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafybeibqktr73eetw3qy4uwtnn4kcn6ziepg4g5koexpi2hjo6okbwb4em",
    channelId: "travel",
  },
  {
    name: "Unlonely",
    parentUrl:
      "chain://eip155:1/erc721:0xc7e230ce8d67b2ad116208c69d616dd6bfc96a8d",
    image:
      "https://i.seadn.io/gcs/files/40b68bc7d827a185cc044d1a4b872a20.png?auto=format&dpr=1&w=512",
    channelId: "unlonely",
  },
  {
    name: "Warpcast",
    parentUrl:
      "chain://eip155:7777777/erc721:0x10a77f29a6bbeae936f3f27cd60546072dae4e41",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreifezhnp5wzgabkdbkb6d65oix4r5axibupv45r7ifxphl4d6qqnry",
    channelId: "warpcast",
  },
  {
    name: "Welcome",
    parentUrl:
      "chain://eip155:7777777/erc721:0x8f0055447ffae257e9025b781643127ca604baaa",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreieraqfkny7bttxd7h7kmnz6zy76vutst3qbjgjxsjnvrw7z3i2n7i",
    channelId: "welcome",
  },
  {
    name: "zk",
    parentUrl:
      "chain://eip155:7777777/erc721:0xec30bb189781bbd87478f625d19d9deeeb771964",
    image:
      "https://ipfs.decentralized-content.com/ipfs/bafkreibw7zsrdhxe3xl454jrfqytx72cjjibwp3t6scjzhirqehu2jloga",
    channelId: "zk",
  },
  {
    name: "Zorbs",
    parentUrl:
      "chain://eip155:1/erc721:0xca21d4228cdcc68d4e23807e5e370c07577dd152",
    image:
      "https://i.seadn.io/gae/O2J_GV66yHfYeHIl-ASFknUqJ1qPB-W1D6xB2Xk-Po9GVE5Te9hkBSPsjCVTTHzq1QYgLppo4LcDtHiV3pxeSfB1b9_fP5pGbiRuUg?auto=format&dpr=1&w=256",
    channelId: "zorbs",
  },
];

export const CHANNELS_BY_URL: { [key: string]: Channel } = CHANNELS.reduce(
  (acc, community) => {
    acc[community.parentUrl] = community;
    return acc;
  },
  {} as { [key: string]: Channel }
);

export const CHANNELS_BY_ID: { [key: string]: Channel } = CHANNELS.reduce(
  (acc, community) => {
    acc[community.channelId] = community;
    return acc;
  },
  {} as { [key: string]: Channel }
);
